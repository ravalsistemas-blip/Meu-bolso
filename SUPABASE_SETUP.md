# Configuração do Supabase

Este projeto está configurado para usar o Supabase como backend. Siga os passos abaixo para configurar completamente:

## 1. Configuração das Tabelas

Execute o SQL contido no arquivo `supabase-schema.sql` no seu projeto Supabase:

1. Acesse o [dashboard do Supabase](https://supabase.com/dashboard)
2. Vá para o projeto: https://vxobrkwqmeqacxjgbowy.supabase.co
3. Navegue até "SQL Editor"
4. Cole e execute o conteúdo do arquivo `supabase-schema.sql`

## 2. Estrutura das Tabelas

### expenses
- Armazena todas as despesas dos usuários
- Campos: id, user_id, name, amount, category, payment_method, type, date, investment_balance
- Suporte para categorização e tipos diferentes de despesas

### income
- Armazena a renda mensal dos usuários
- Campos: id, user_id, salary, extra_income, month, year
- Um registro por usuário por mês/ano

### monthly_history
- Histórico mensal consolidado
- Campos: id, user_id, month, year, total_income, total_expenses, remaining_income
- Útil para relatórios e análises

## 3. Segurança (RLS)

O projeto está configurado com Row Level Security (RLS):
- Cada usuário só pode ver e modificar seus próprios dados
- Políticas de segurança aplicadas automaticamente

## 4. Variáveis de Ambiente

As credenciais do Supabase estão configuradas em `.env`:
```
VITE_SUPABASE_URL=https://vxobrkwqmeqacxjgbowy.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 5. Uso no Código

Os serviços estão disponíveis em `src/lib/database.ts`:

```typescript
import { expenseService, incomeService, monthlyHistoryService, authService } from '@/lib/database'

// Exemplo: Adicionar despesa
await expenseService.addExpense({
  name: 'Conta de luz',
  amount: 150.00,
  category: 'Moradia',
  payment_method: 'salary',
  type: 'fixed',
  date: '2025-01'
})

// Exemplo: Buscar renda do mês
const income = await incomeService.getIncome('janeiro', 2025)
```

## 6. Autenticação

O projeto suporta autenticação por email:
- Registro de novos usuários
- Login/logout
- Proteção automática dos dados por usuário

## 7. Próximos Passos

1. Execute o SQL no Supabase Dashboard
2. Configure autenticação se necessário
3. Teste a conexão executando o projeto
4. Integre os serviços no componente React principal

## 8. Troubleshooting

- Verifique se as tabelas foram criadas corretamente
- Confirme que o RLS está habilitado
- Teste a conexão com o Supabase no browser console
