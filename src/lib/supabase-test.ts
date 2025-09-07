import { supabase } from './supabase'

// Função para testar a conexão com o Supabase
export async function testSupabaseConnection() {
  try {
    console.log('🔄 Testando conexão com Supabase...')
    
    // Teste básico de conectividade
    const { data, error } = await supabase
      .from('expenses')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Erro na conexão:', error.message)
      return false
    }
    
    console.log('✅ Conexão com Supabase funcionando!')
    console.log('📊 Dados de teste:', data)
    return true
  } catch (err) {
    console.error('❌ Erro inesperado:', err)
    return false
  }
}

// Função para verificar autenticação
export async function testAuth() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.log('ℹ️ Usuário não autenticado:', error.message)
      return null
    }
    
    if (user) {
      console.log('✅ Usuário autenticado:', user.email)
      return user
    } else {
      console.log('ℹ️ Nenhum usuário logado')
      return null
    }
  } catch (err) {
    console.error('❌ Erro ao verificar autenticação:', err)
    return null
  }
}

// Função para verificar estrutura das tabelas
export async function checkDatabaseStructure() {
  try {
    console.log('🔍 Verificando estrutura do banco...')
    
    // Verificar tabela expenses
    const expensesTest = await supabase
      .from('expenses')
      .select('*')
      .limit(1)
    
    if (expensesTest.error) {
      console.error('❌ Tabela expenses não encontrada:', expensesTest.error.message)
    } else {
      console.log('✅ Tabela expenses OK')
    }
    
    // Verificar tabela income
    const incomeTest = await supabase
      .from('income')
      .select('*')
      .limit(1)
    
    if (incomeTest.error) {
      console.error('❌ Tabela income não encontrada:', incomeTest.error.message)
    } else {
      console.log('✅ Tabela income OK')
    }
    
    // Verificar tabela monthly_history
    const historyTest = await supabase
      .from('monthly_history')
      .select('*')
      .limit(1)
    
    if (historyTest.error) {
      console.error('❌ Tabela monthly_history não encontrada:', historyTest.error.message)
    } else {
      console.log('✅ Tabela monthly_history OK')
    }
    
  } catch (err) {
    console.error('❌ Erro ao verificar estrutura:', err)
  }
}

// Função para executar todos os testes
export async function runAllTests() {
  console.log('🚀 Iniciando testes do Supabase...')
  console.log('=' .repeat(50))
  
  await testSupabaseConnection()
  await testAuth()
  await checkDatabaseStructure()
  
  console.log('=' .repeat(50))
  console.log('✨ Testes concluídos!')
}
