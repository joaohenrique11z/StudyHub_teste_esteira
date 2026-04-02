import { supabase } from './supabase.js'

export async function protegerPagina() {
  const { data } = await supabase.auth.getUser()

  if (!data.user) {
    window.location.href = "index.html"
  }
}