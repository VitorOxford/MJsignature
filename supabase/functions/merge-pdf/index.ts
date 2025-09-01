// supabase/functions/merge-pdf/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Tratamento de CORS para requisições pre-flight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { templateId, formData } = await req.json()
    if (!templateId || !formData) {
      throw new Error('Faltam parâmetros essenciais (templateId, formData)')
    }

    // Inicializa o cliente Supabase com a chave de administrador (service role)
    // para ter permissões totais no backend.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_KEY') ?? '' // CORRIGIDO: Usa a variável de ambiente correta
    );

    // 1. Busca os detalhes do template, incluindo os campos e o caminho do arquivo.
    const { data: template, error: templateError } = await supabaseAdmin
      .from('document_templates')
      .select('storage_path, editable_fields')
      .eq('id', templateId)
      .single()

    if (templateError) throw templateError

    // 2. Baixa o arquivo PDF original do Supabase Storage.
    const { data: pdfBlob, error: downloadError } = await supabaseAdmin.storage
      .from('templates')
      .download(template.storage_path)
    
    if (downloadError) throw downloadError
    
    const pdfBytes = await pdfBlob.arrayBuffer()
    const pdfDoc = await PDFDocument.load(pdfBytes)
    const page = pdfDoc.getPages()[0] // Trabalha com a primeira página do PDF
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    
    // 3. Itera sobre os campos definidos pelo admin e "desenha" os dados enviados pelo usuário no PDF.
    for (const field of template.editable_fields) {
      const data = formData[field.id]
      if (!data) continue // Pula se o campo não foi preenchido

      // A biblioteca pdf-lib conta a coordenada Y a partir da base da página,
      // então precisamos inverter a coordenada do nosso frontend.
      const y = page.getHeight() - field.y - field.height

      if (field.type === 'text') {
        page.drawText(data, {
          x: field.x + 5, // Pequeno padding
          y: y + (field.height / 2) - 5, // Ajuste para tentar centralizar o texto verticalmente
          size: 12,
          font,
          color: rgb(0, 0, 0), // Cor preta
        })
      } else if (field.type === 'signature' && data.startsWith('data:image/png;base64,')) {
        // Converte a assinatura (imagem em base64) para bytes e a insere no PDF.
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

    // 4. Salva o PDF modificado em memória.
    const newPdfBytes = await pdfDoc.save()
    
    // 5. Faz o upload do novo PDF para um bucket de 'documentos-assinados'.
    const newFilePath = `signed/${crypto.randomUUID()}.pdf`
    const { error: uploadError } = await supabaseAdmin.storage
      .from('documentos-assinados') // Certifique-se que este bucket existe!
      .upload(newFilePath, newPdfBytes, { contentType: 'application/pdf' })

    if (uploadError) throw uploadError

    // 6. Retorna uma resposta de sucesso com o caminho do novo arquivo.
    return new Response(JSON.stringify({ path: newFilePath }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    // Retorna uma resposta de erro caso algo falhe no processo.
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})