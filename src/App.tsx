import { supabase } from './lib/supabase'

function App() {
  async function handleNewQuote() {
    try {
      const { data, error } = await supabase.rpc('fn_create_quote', {
        p_customer_type: 'privato',
        p_customer_name: 'Cliente temporaneo',
        p_customer_email: null,
        p_customer_phone: null,
        p_job_address: null,
        p_price_list_id: null,
        p_vat: '22',
        p_validity_days: 15,
        p_terms: 'Pagamenti a 30gg.',
        p_notes: null,
      })
      if (error) throw error
      const res = data?.[0]
      alert(`Creato: ${res.quote_number}`)
      console.log('Nuovo preventivo', res) // { quote_id, version_id, quote_number }
    } catch (e:any) {
      alert('Errore: ' + e.message)
      console.error(e)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-semibold">Preventivatore X – MVP</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <button
          onClick={handleNewQuote}
          className="px-4 py-2 rounded-lg bg-black text-white hover:opacity-90"
        >
          Nuovo preventivo
        </button>
        <p className="mt-4 text-sm text-gray-600">
          Clicca per creare PRE-YYYY-#### (Rev 1) tramite RPC Supabase.
        </p>
      </main>
    </div>
  )
}

export default App