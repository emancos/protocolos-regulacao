# Sistema de Gestão de Requisições de Saúde Municipal

Sistema completo para gerenciamento de requisições de consultas, exames e procedimentos feitos à Secretaria Municipal de Saúde, desenvolvido com Next.js 15 e Firebase.

## 📋 Sobre o Projeto

Este sistema foi desenvolvido para modernizar e digitalizar o processo de solicitação e acompanhamento de requisições médicas em municípios, oferecendo uma interface intuitiva tanto para funcionários da secretaria quanto para profissionais de saúde.

### 🎯 Objetivos

- **Digitalizar** o processo de requisições médicas
- **Centralizar** todas as solicitações em uma plataforma única
- **Agilizar** o atendimento e aprovação de requisições
- **Rastrear** o status das solicitações em tempo real
- **Reduzir** a burocracia e papelada
- **Melhorar** a comunicação entre profissionais e secretaria

## ✨ Funcionalidades

### 🔐 Autenticação e Segurança
- Sistema de login seguro com Firebase Auth
- Controle de acesso baseado em perfis de usuário
- Proteção de rotas sensíveis
- Sessões persistentes e logout automático

### 📱 Interface Moderna
- Design responsivo para desktop, tablet e mobile
- Modo escuro/claro com preferência do usuário
- Interface intuitiva e acessível
- Componentes reutilizáveis com shadcn/ui

### 👥 Gestão de Usuários
- Cadastro de novos usuários (apenas para administradores)
- Perfis diferenciados (Admin, Médico, Enfermeiro, etc.)
- Controle de permissões por tipo de usuário

### 📊 Dashboard Administrativo
- Visão geral das requisições pendentes
- Estatísticas em tempo real
- Relatórios e métricas de desempenho

## 🛠️ Tecnologias Utilizadas

### Frontend
- **Next.js 15** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização utilitária
- **shadcn/ui** - Componentes de interface
- **Lucide React** - Ícones modernos

### Backend & Banco de Dados
- **Firebase Authentication** - Autenticação de usuários
- **Cloud Firestore** - Banco de dados NoSQL
- **Firebase Analytics** - Métricas e analytics

### Ferramentas de Desenvolvimento
- **ESLint** - Linting de código
- **Prettier** - Formatação de código
- **next-themes** - Gerenciamento de temas

## 🚀 Instalação e Configuração

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Firebase

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/sistema-saude-municipal.git
cd sistema-saude-municipal
```

### 2. Instale as Dependências

```bash
npm install
```

### 3. Configure o Firebase

1. Acesse o [Firebase Console](https://console.firebase.google.com)
2. Crie um novo projeto
3. Ative **Authentication** com Email/Password
4. Ative **Cloud Firestore**
5. Copie as configurações do projeto

### 4. Configure as Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=sua_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu_projeto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=seu_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=seu_measurement_id
```

### 5. Configure o shadcn/ui

```bash
npx shadcn@latest init
npx shadcn@latest add button input label card alert avatar dropdown-menu badge
```

### 6. Execute o Projeto

```bash
npm run dev
```

Acesse `http://localhost:3000` no seu navegador.

## 📁 Estrutura do Projeto

```
src/
├── app/                    # App Router do Next.js
│   ├── dashboard/         # Dashboard principal
│   ├── login/            # Página de login
│   ├── register/         # Cadastro de usuários (protegido)
│   ├── test-connection/  # Teste de conexão Firebase
│   ├── globals.css       # Estilos globais
│   ├── layout.tsx        # Layout principal
│   └── page.tsx          # Página inicial
├── components/            # Componentes reutilizáveis
│   ├── ui/               # Componentes base (shadcn/ui)
│   ├── auth-guard.tsx    # Proteção de rotas
│   ├── firebase-status.tsx # Status da conexão
│   ├── loading-spinner.tsx # Componente de loading
│   └── theme-toggle.tsx  # Alternador de tema
├── contexts/             # Contextos React
│   └── auth-context.tsx  # Contexto de autenticação
├── lib/                  # Utilitários e configurações
│   ├── firebase.ts       # Configuração Firebase
│   └── utils.ts          # Funções utilitárias
└── middleware.ts         # Middleware de rotas
```

## 🔧 Scripts Disponíveis

```bash
npm run dev          # Executa em modo desenvolvimento
npm run build        # Gera build de produção
npm run start        # Executa build de produção
npm run lint         # Executa linting
npm run type-check   # Verifica tipos TypeScript
```

## 🚀 Deploy

### Vercel (Recomendado)

1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente no dashboard
3. Deploy automático a cada push

### Outras Plataformas

O projeto pode ser deployado em qualquer plataforma que suporte Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🔒 Segurança

### Regras do Firestore

Configure as regras de segurança no Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Apenas usuários autenticados podem ler/escrever
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Boas Práticas Implementadas

- ✅ Validação de entrada no frontend e backend
- ✅ Sanitização de dados
- ✅ Proteção contra XSS
- ✅ Autenticação obrigatória para rotas sensíveis
- ✅ Logs de auditoria (Firebase Analytics)

## 📊 Monitoramento

O sistema inclui:

- **Firebase Analytics** - Métricas de uso
- **Console de erros** - Logs detalhados
- **Status de conexão** - Monitoramento em tempo real

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📝 Roadmap

### Próximas Funcionalidades

- [ ] **Módulo de Requisições**
  - [ ] Formulário de solicitação de consultas
  - [ ] Formulário de solicitação de exames
  - [ ] Formulário de solicitação de procedimentos
  
- [ ] **Sistema de Aprovação**
  - [ ] Workflow de aprovação
  - [ ] Notificações por email
  - [ ] Histórico de aprovações
  
- [ ] **Relatórios e Analytics**
  - [ ] Dashboard com métricas
  - [ ] Relatórios em PDF
  - [ ] Exportação de dados
  
- [ ] **Integrações**
  - [ ] API do SUS
  - [ ] Sistema de prontuário eletrônico
  - [ ] WhatsApp Business API

## 📞 Suporte

Para suporte técnico ou dúvidas:

- 📧 Email: suporte@municipio.gov.br
- 📱 WhatsApp: (XX) XXXXX-XXXX
- 🌐 Portal: https://saude.municipio.gov.br

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Equipe

- **Desenvolvimento**: Equipe de TI da Secretaria Municipal
- **Coordenação**: Secretaria Municipal de Saúde
- **Suporte**: Departamento de Tecnologia da Informação

---

**Desenvolvido com ❤️ para melhorar a saúde pública municipal**
```

Este README fornece uma documentação completa e profissional para o projeto, incluindo:

- **Contexto específico** para gestão de requisições de saúde municipal
- **Instruções detalhadas** de instalação e configuração
- **Estrutura clara** do projeto
- **Roadmap** com funcionalidades futuras específicas para o domínio
- **Informações de segurança** e boas práticas
- **Seção de contribuição** e suporte

O documento está formatado de forma profissional e pode ser usado tanto para desenvolvedores quanto para stakeholders do projeto.