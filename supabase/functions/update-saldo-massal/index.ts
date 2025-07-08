import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get the request body
    const { updates, tipe, keterangan, tanggal_transaksi } = await req.json()

    if (!updates || !tipe || !keterangan) {
      return new Response(
        JSON.stringify({ error: 'Payload tidak lengkap. Butuh "updates", "tipe", dan "keterangan".' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Call the RPC function in the database
    const { data, error } = await supabaseClient.rpc('batch_update_saldo', {
      p_updates: updates,
      p_tipe: tipe,
      p_keterangan: keterangan,
      p_tanggal_transaksi: tanggal_transaksi,
    })

    if (error) {
      throw error
    }

    // Return the result from the RPC function
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: data.success ? 200 : 400 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})