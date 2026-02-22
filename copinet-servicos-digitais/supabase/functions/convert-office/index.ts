import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { storagePath, fileName, bucket } = await req.json();
    if (!storagePath) {
      return new Response(JSON.stringify({ error: 'storagePath obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const cloudKey = Deno.env.get('CLOUDCONVERT_API_KEY');

    if (!supabaseUrl || !serviceKey || !cloudKey) {
      return new Response(JSON.stringify({ error: 'Variáveis de ambiente ausentes' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const bucketName = bucket || 'impressao-rapida';
    const { data: fileBlob, error: downloadError } = await supabase.storage.from(bucketName).download(storagePath);
    if (downloadError || !fileBlob) {
      return new Response(JSON.stringify({ error: 'Falha ao baixar arquivo' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const resolvedName = fileName || storagePath.split('/').pop() || `arquivo-${Date.now()}`;
    const jobResponse = await fetch('https://api.cloudconvert.com/v2/jobs', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cloudKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tasks: {
          'import-file': { operation: 'import/upload' },
          'convert-file': { operation: 'convert', input: 'import-file', output_format: 'pdf' },
          'export-file': { operation: 'export/url', input: 'convert-file' }
        }
      })
    });

    const jobPayload = await jobResponse.json();
    const tasks = Array.isArray(jobPayload?.data?.tasks)
      ? jobPayload.data.tasks
      : Object.values(jobPayload?.data?.tasks ?? {});
    const importTask = tasks.find((task: any) => task.name === 'import-file' || task.operation === 'import/upload');
    const uploadForm = importTask?.result?.form;
    if (!uploadForm?.url || !uploadForm?.parameters) {
      return new Response(JSON.stringify({ error: 'Falha ao iniciar upload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const formData = new FormData();
    Object.entries(uploadForm.parameters).forEach(([key, value]) => {
      formData.append(key, value as string);
    });
    formData.append('file', new File([fileBlob], resolvedName));
    await fetch(uploadForm.url, { method: 'POST', body: formData });

    let jobStatus = jobPayload?.data;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const statusRes = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobStatus.id}`, {
        headers: { Authorization: `Bearer ${cloudKey}` }
      });
      const statusPayload = await statusRes.json();
      jobStatus = statusPayload?.data;
      if (jobStatus?.status === 'finished') break;
      if (jobStatus?.status === 'error') {
        return new Response(JSON.stringify({ error: 'Conversão falhou' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      await wait(1500);
    }

    const finishedTasks = Array.isArray(jobStatus?.tasks)
      ? jobStatus.tasks
      : Object.values(jobStatus?.tasks ?? {});
    const exportTask = finishedTasks.find((task: any) => task.name === 'export-file' || task.operation === 'export/url');
    const exportUrl = exportTask?.result?.files?.[0]?.url;
    if (!exportUrl) {
      return new Response(JSON.stringify({ error: 'Arquivo convertido indisponível' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const pdfResponse = await fetch(exportUrl);
    const pdfBlob = await pdfResponse.blob();
    const baseName = resolvedName.replace(/\.[^.]+$/, '');
    const convertedPath = `converted/${baseName}-${Date.now()}.pdf`;
    const { error: uploadError } = await supabase.storage.from(bucketName).upload(convertedPath, pdfBlob, {
      contentType: 'application/pdf'
    });
    if (uploadError) {
      return new Response(JSON.stringify({ error: 'Falha ao salvar PDF' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: publicData } = supabase.storage.from(bucketName).getPublicUrl(convertedPath);
    return new Response(JSON.stringify({ convertedPath, convertedUrl: publicData.publicUrl }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Erro inesperado' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
