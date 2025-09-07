# Planning Guide

Uma aplicação completa de controle financeiro pessoal que permite o usuário gerenciar despesas fixas e variáveis, monitorar gastos com salário e cartão de crédito, e acompanhar limites orçamentários em tempo real.

**Experience Qualities**: 
1. **Confiável** - O usuário deve sentir segurança ao inserir e visualizar seus dados financeiros
2. **Intuitivo** - Interface clara que torna o controle financeiro simples e acessível
3. **Motivador** - Feedback visual positivo que encoraja bons hábitos financeiros

**Complexity Level**: Light Application (multiple features with basic state)
- A aplicação gerencia múltiplas categorias de despesas, cálculos orçamentários e visualizações, mas mantém simplicidade de uso sem necessidade de contas complexas.

## Essential Features

**Gestão de Renda**
- Functionality: Definir salário mensal e outros tipos de renda
- Purpose: Estabelecer base para cálculos orçamentários
- Trigger: Botão "Definir Renda" no dashboard principal
- Progression: Clique no botão → Modal com campos de renda → Salvar → Atualização automática dos limites
- Success criteria: Renda salva persiste entre sessões e reflete nos cálculos

**Despesas Fixas**
- Functionality: Cadastrar e gerenciar gastos mensais recorrentes (aluguel, contas, etc.)
- Purpose: Controlar gastos obrigatórios que impactam o orçamento
- Trigger: Seção "Despesas Fixas" com botão "Adicionar"
- Progression: Adicionar → Preencher nome/valor → Salvar → Exibição na lista → Cálculo automático do total
- Success criteria: Lista atualizada em tempo real com total correto

**Despesas Variáveis**
- Functionality: Registrar gastos do dia a dia com categorização
- Purpose: Monitorar gastos flexíveis e identificar padrões de consumo
- Trigger: Seção "Despesas Variáveis" com botão de adição rápida
- Progression: Adicionar → Selecionar categoria → Inserir valor → Escolher método de pagamento → Confirmar
- Success criteria: Gastos categorizados corretamente com impacto nos limites

**Controle de Cartão de Crédito**
- Functionality: Definir limite do cartão e acompanhar gastos realizados
- Purpose: Evitar estourar o limite e controlar endividamento
- Trigger: Seção dedicada "Cartão de Crédito"
- Progression: Definir limite → Registrar gastos → Visualizar saldo disponível → Alertas quando próximo do limite
- Success criteria: Saldo atualizado automaticamente com alertas visuais

**Dashboard Financeiro**
- Functionality: Visão geral com resumos, gráficos e indicadores de saúde financeira
- Purpose: Oferecer insights rápidos sobre a situação financeira atual
- Trigger: Tela principal da aplicação
- Progression: Abertura da app → Visualização imediata dos dados → Navegação para detalhes conforme necessário
- Success criteria: Informações atualizadas em tempo real com indicadores visuais claros

## Edge Case Handling

- **Valores negativos**: Validação impede inserção de valores inválidos
- **Limite de cartão ultrapassado**: Alerta visual vermelho e bloqueio de novos gastos no cartão
- **Renda insuficiente**: Indicador quando despesas excedem renda disponível
- **Dados vazios**: Estados vazios com orientações para primeiros passos
- **Edição acidental**: Confirmação para exclusões e opção de desfazer
- **Formato de moeda**: Formatação automática para Real brasileiro

## Design Direction

O design deve evocar confiança e profissionalismo financeiro com uma abordagem moderna e limpa, similar a aplicativos bancários premium. Interface minimalista que prioriza clareza dos dados numéricos e facilita tomada de decisões rápidas.

## Color Selection

Complementary (opposite colors) - Usando verde para indicar saúde financeira e vermelho para alertas de gastos excessivos, criando contraste emocional claro.

- **Primary Color**: Verde escuro `oklch(0.45 0.15 145)` - Transmite estabilidade financeira e crescimento
- **Secondary Colors**: Azul acinzentado `oklch(0.55 0.08 230)` para informações neutras e cinza claro `oklch(0.95 0.02 230)` para backgrounds
- **Accent Color**: Laranja vibrante `oklch(0.7 0.18 45)` para CTAs importantes e alertas de atenção
- **Foreground/Background Pairings**:
  - Background (Branco #FFFFFF): Texto escuro `oklch(0.2 0.02 230)` - Ratio 15.8:1 ✓
  - Primary (Verde #2D5A3D): Texto branco `oklch(0.98 0.01 145)` - Ratio 8.2:1 ✓
  - Secondary (Azul-cinza #6B7B8C): Texto branco `oklch(0.98 0.01 230)` - Ratio 5.1:1 ✓
  - Accent (Laranja #C67326): Texto branco `oklch(0.98 0.01 45)` - Ratio 4.9:1 ✓
  - Card (Cinza claro #F8F9FA): Texto escuro `oklch(0.2 0.02 230)` - Ratio 14.8:1 ✓

## Font Selection

Tipografia deve transmitir confiança e legibilidade perfeita para números e dados financeiros, usando Inter por sua clareza em interfaces digitais e excelente rendering de números.

- **Typographic Hierarchy**:
  - H1 (Títulos principais): Inter Bold/32px/tight letter spacing
  - H2 (Seções): Inter SemiBold/24px/normal letter spacing  
  - H3 (Subsections): Inter Medium/18px/normal letter spacing
  - Body (Texto geral): Inter Regular/16px/normal letter spacing
  - Numbers (Valores monetários): Inter Medium/18px/tabular numbers
  - Small (Labels): Inter Medium/14px/slight letter spacing

## Animations

Animações sutis e funcionais que reforçam feedback de ações financeiras sem distrair da seriedade dos dados, priorizando micro-interações que confirmam sucesso de operações.

- **Purposeful Meaning**: Transições suaves entre estados de dados reforçam a continuidade das informações financeiras
- **Hierarchy of Movement**: Animações de destaque para alertas de limites e confirmações de salvamento de dados importantes

## Component Selection

- **Components**: 
  - Cards para seções de despesas e resumos financeiros
  - Input/Label para formulários de valores monetários
  - Button com variantes primary/secondary para ações principais/secundárias
  - Alert para avisos de limites e validações
  - Progress para indicadores de uso de orçamento
  - Tabs para navegação entre diferentes tipos de despesas
  - Dialog para formulários de adição/edição
  - Badge para categorias e status

- **Customizations**: 
  - Componente de input monetário com formatação automática para Real
  - Cards com indicadores visuais de status (verde/vermelho) baseados em limites
  - Progress bars customizadas com cores condicionais

- **States**: 
  - Buttons: Estados distintos para ações financeiras críticas (salvar, excluir)
  - Inputs: Validação em tempo real com feedback visual para valores monetários
  - Cards: Estados de alerta quando limites são ultrapassados

- **Icon Selection**: 
  - Plus para adicionar despesas
  - CreditCard para gastos no cartão
  - Wallet para gastos em dinheiro/débito
  - TrendingUp/TrendingDown para indicadores financeiros
  - AlertTriangle para avisos de limite

- **Spacing**: 
  - Padding: p-6 para cards principais, p-4 para elementos internos
  - Margins: mb-6 entre seções, mb-4 entre elementos relacionados
  - Gaps: gap-4 para grids de cards, gap-2 para elementos próximos

- **Mobile**: 
  - Layout mobile-first com cards empilhados verticalmente
  - Navegação por tabs otimizada para toque
  - Inputs maiores para facilitar inserção de valores no mobile
  - Gestos de swipe para ações rápidas em listas de despesas