# Supabase Database Documentation

## Overview
Este documento descreve a estrutura do banco de dados PostgreSQL no Supabase para o Expense Tracker Pro.

## Arquivos SQL

### 1. `supabase-schema.sql`
Script principal que cria toda a estrutura do banco de dados do zero.

**Como usar:**
1. Acesse o Supabase Dashboard
2. Vá para "SQL Editor"
3. Cole o conteúdo do arquivo `supabase-schema.sql`
4. Execute o script

### 2. `supabase-setup.sql`
Instruções passo a passo para configurar e testar o banco de dados.

### 3. `supabase-migration.sql`
Script para migrar dados existentes para a nova estrutura.

## Estrutura do Banco de Dados

### Tabelas Principais

#### `profiles`
Perfis dos usuários do sistema.
```sql
- id: UUID (PK, referência para auth.users)
- email: TEXT (único)
- full_name: TEXT
- avatar_url: TEXT
- created_at, updated_at: TIMESTAMP
```

#### `monthly_income`
Renda mensal dos usuários.
```sql
- id: UUID (PK)
- user_id: UUID (FK para profiles)
- month: TEXT (ex: "janeiro", "fevereiro")
- year: INTEGER
- salary: DECIMAL(10,2)
- extra_income: DECIMAL(10,2)
- total_income: DECIMAL(10,2) (calculado automaticamente)
- created_at, updated_at: TIMESTAMP
- UNIQUE(user_id, month, year)
```

#### `expenses`
Despesas dos usuários (fixas, variáveis e investimentos).
```sql
- id: UUID (PK)
- user_id: UUID (FK para profiles)
- name: TEXT
- amount: DECIMAL(10,2)
- category: TEXT
- payment_method: TEXT ('salary' | 'extra')
- expense_type: TEXT ('fixed' | 'variable' | 'investment')
- investment_balance: DECIMAL(10,2) (opcional)
- month: TEXT
- year: INTEGER
- date: TIMESTAMP
- created_at, updated_at: TIMESTAMP
```

#### `monthly_summary`
Resumo mensal consolidado (calculado automaticamente).
```sql
- id: UUID (PK)
- user_id: UUID (FK para profiles)
- month: TEXT
- year: INTEGER
- total_income: DECIMAL(10,2)
- total_expenses: DECIMAL(10,2)
- total_fixed_expenses: DECIMAL(10,2)
- total_variable_expenses: DECIMAL(10,2)
- total_investment_expenses: DECIMAL(10,2)
- remaining_income: DECIMAL(10,2) (calculado)
- salary_usage_percent: DECIMAL(5,2)
- extra_usage_percent: DECIMAL(5,2)
- created_at, updated_at: TIMESTAMP
- UNIQUE(user_id, month, year)
```

#### `activity_logs`
Log de atividades para auditoria e sincronização.
```sql
- id: UUID (PK)
- user_id: UUID (FK para profiles)
- section: TEXT ('income', 'expense', 'investment', etc.)
- action: TEXT ('create', 'update', 'delete', 'sync')
- description: TEXT
- amount: DECIMAL(10,2)
- category: TEXT
- month: TEXT
- year: INTEGER
- metadata: JSONB
- created_at: TIMESTAMP
```

#### `expense_categories`
Categorias de despesas (padrão + personalizadas).
```sql
- id: UUID (PK)
- user_id: UUID (FK para profiles)
- name: TEXT
- icon: TEXT
- color: TEXT
- is_default: BOOLEAN
- created_at: TIMESTAMP
- UNIQUE(user_id, name)
```

### Views

#### `consolidated_investments`
Consolida investimentos por nome, calculando total investido e saldo atual.

#### `monthly_report`
Relatório mensal completo com todos os dados consolidados.

### Funções

#### `handle_new_user()`
Cria automaticamente um perfil quando um usuário se registra.

#### `calculate_monthly_summary()`
Calcula automaticamente o resumo mensal quando receitas ou despesas são alteradas.

#### `export_monthly_data(user_id, month, year)`
Exporta dados mensais em formato tabular para CSV.

#### `update_updated_at_column()`
Atualiza automaticamente o campo `updated_at`.

### Triggers

- **Auto Profile Creation**: Cria perfil automaticamente no registro
- **Auto Summary Calculation**: Recalcula resumos quando dados mudam
- **Auto Timestamp Update**: Atualiza timestamps automaticamente

### Índices

- Índices otimizados para consultas por usuário, mês e ano
- Índices para categorias e tipos de despesas
- Índices para logs de atividade ordenados por data

### Row Level Security (RLS)

Todas as tabelas têm RLS habilitado com políticas que garantem:
- Usuários só veem seus próprios dados
- Usuários só podem modificar seus próprios dados
- Categorias padrão são visíveis para todos

## Como Configurar

### Primeira Configuração (Banco Novo)

1. **Execute o schema principal:**
```sql
-- No SQL Editor do Supabase
-- Cole o conteúdo de supabase-schema.sql
```

2. **Verifique se as tabelas foram criadas:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

3. **Teste com dados de exemplo:**
```sql
-- Substitua 'your-user-id' pelo ID real do usuário
INSERT INTO public.monthly_income (user_id, month, year, salary, extra_income)
VALUES ('your-user-id', 'janeiro', 2025, 5000.00, 1000.00);
```

### Migração de Dados Existentes

1. **Execute o script de migração:**
```sql
-- No SQL Editor do Supabase
-- Cole o conteúdo de supabase-migration.sql
```

2. **Verifique a migração:**
```sql
SELECT * FROM public.monthly_summary LIMIT 5;
```

## Integração com o Frontend

### Variáveis de Ambiente

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Exemplos de Consultas TypeScript

```typescript
// Buscar despesas do mês
const { data: expenses } = await supabase
  .from('expenses')
  .select('*')
  .eq('user_id', user.id)
  .eq('month', 'janeiro')
  .eq('year', 2025);

// Buscar resumo mensal
const { data: summary } = await supabase
  .from('monthly_summary')
  .select('*')
  .eq('user_id', user.id)
  .eq('month', 'janeiro')
  .eq('year', 2025)
  .single();

// Exportar dados do mês
const { data: exportData } = await supabase
  .rpc('export_monthly_data', {
    p_user_id: user.id,
    p_month: 'janeiro',
    p_year: 2025
  });
```

## Backup e Manutenção

### Backup Automático
O Supabase faz backup automático, mas você pode exportar dados manualmente:

```sql
-- Exportar dados de um usuário
SELECT * FROM public.export_monthly_data('user-id', 'janeiro', 2025);
```

### Limpeza de Logs
Para manter performance, limpe logs antigos periodicamente:

```sql
-- Manter apenas logs dos últimos 6 meses
DELETE FROM public.activity_logs 
WHERE created_at < NOW() - INTERVAL '6 months';
```

### Monitoramento
Monitore o crescimento das tabelas:

```sql
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation,
    most_common_vals
FROM pg_stats 
WHERE schemaname = 'public';
```

## Troubleshooting

### Problemas Comuns

1. **RLS bloqueando consultas**
   - Verifique se o usuário está autenticado
   - Confirme que as políticas RLS estão corretas

2. **Triggers não executando**
   - Verifique se as funções existem
   - Confirme que os triggers estão habilitados

3. **Performance lenta**
   - Verifique se os índices estão sendo usados
   - Analise o plano de execução das consultas

### Comandos de Debug

```sql
-- Verificar RLS
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Verificar triggers
SELECT * FROM pg_trigger WHERE tgname LIKE '%monthly%';

-- Verificar índices
SELECT * FROM pg_indexes WHERE schemaname = 'public';
```

## Próximos Passos

1. **Implementar autenticação**
2. **Configurar realtime subscriptions**
3. **Adicionar validações no frontend**
4. **Implementar cache para consultas frequentes**
5. **Configurar alertas de monitoramento**
