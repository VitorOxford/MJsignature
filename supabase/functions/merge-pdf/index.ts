// supabase/functions/merge-pdf/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Tratamento de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { templateId, formData } = await req.json()
    if (!templateId || !formData) {
      throw new Error('Faltam parâmetros essenciais (templateId, formData)')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Use a chave correta
    );

    // 1. Busca os detalhes do template.
    const { data: template, error: templateError } = await supabaseAdmin
      .from('document_templates')
      .select('storage_path, editable_fields')
      .eq('id', templateId)
      .single()

    if (templateError) throw templateError

    // 2. Baixa o PDF original do Storage.
    const { data: pdfBlob, error: downloadError } = await supabaseAdmin.storage
      .from('templates')
      .download(template.storage_path)
    
    if (downloadError) throw downloadError
    
    const pdfBytes = await pdfBlob.arrayBuffer()
    const pdfDoc = await PDFDocument.load(pdfBytes)
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const pages = pdfDoc.getPages()
    
    // 3. Itera sobre os campos e desenha na página correta.
    for (const field of template.editable_fields) {
      const data = formData[field.id]
      if (!data) continue

      // CORREÇÃO: Pega a página correta para este campo (assume 1 se não for especificada).
      // A biblioteca usa índice 0, então subtraímos 1.
      const pageIndex = (field.page || 1) - 1;
      const page = pages[pageIndex];

      if (!page) continue // Pula se o número da página for inválido

      // Converte a coordenada Y do frontend para o sistema da pdf-lib.
      const y = page.getHeight() - field.y - field.height

      if (field.type === 'text') {
        page.drawText(data, {
          x: field.x + 5,
          y: y + (field.height / 2) - 5,
          size: 12,
          font,
          color: rgb(0, 0, 0),
        })
      } else if (field.type === 'signature' && data.startsWith('data:image/png;base64,')) {
        const pngImageBytes = data.substring(data.indexOf(',') + 1)
        const pngImage = await pdfDoc.embedPng(pngImageBytes)
        page.drawImage(pngImage, {
          x: field.x,
          y: y,
          width: field.width,
          height: field.height,
        })
      }
    }

    // 4. Salva e faz o upload do novo PDF.
    const newPdfBytes = await pdfDoc.save()
    const newFilePath = `signed/${crypto.randomUUID()}.pdf`
    const { error: uploadError } = await supabaseAdmin.storage
      .from('documentos-assinados')
      .upload(newFilePath, newPdfBytes, { contentType: 'application/pdf' })

    if (uploadError) throw uploadError

    // 6. Retorna o sucesso.
    return new Response(JSON.stringify({ path: newFilePath }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})