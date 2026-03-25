# 🔗 URL Shortener API

Encurtador de URLs completo com API REST, interface web interativa e painel de estatísticas de cliques.

## 📌 Objetivo

O projeto tem como objetivo desenvolver uma API de encurtamento de URLs que permite ao usuário transformar links longos em links curtos e personalizados. A aplicação registra e exibe estatísticas detalhadas de acesso, como quantidade de cliques, cliques por dia, IP e user agent dos visitantes.

## 🚀 Funcionalidades

- **Encurtar URLs** com código aleatório ou alias personalizado
- **Redirecionar** automaticamente ao acessar o link curto
- **Painel de estatísticas** com cliques totais, cliques por dia e últimos acessos
- **Listagem paginada** de todas as URLs criadas
- **Deletar** URLs encurtadas
- **Rate limiting** para proteção contra abuso (100 requisições/min por IP)
- **Interface web** responsiva com tema escuro

## 🛠 Tecnologias Utilizadas

| Tecnologia | Descrição |
|---|---|
| **Node.js** | Ambiente de execução JavaScript no servidor |
| **Express 5** | Framework web para criação da API REST |
| **SQLite** (better-sqlite3) | Banco de dados local, leve e sem necessidade de servidor externo |
| **Nanoid** | Geração de códigos curtos únicos e seguros |
| **CORS** | Middleware para permitir requisições de diferentes origens |
| **Express Rate Limit** | Proteção contra excesso de requisições |
| **Jest** | Framework de testes automatizados |
| **Supertest** | Biblioteca para testes de requisições HTTP |
| **HTML/CSS/JavaScript** | Interface web frontend (single page) |

## 📁 Estrutura do Projeto

```
API_URL/
├── index.js              # Ponto de entrada — inicia o servidor
├── package.json          # Dependências e scripts do projeto
├── public/
│   └── index.html        # Interface web (frontend)
├── src/
│   ├── app.js            # Configuração do Express e middlewares
│   ├── database.js       # Conexão e criação das tabelas no SQLite
│   └── routes/
│       └── urls.js       # Rotas da API (CRUD de URLs)
└── tests/
    └── api.test.js       # Testes automatizados da API
```

## 📦 Pré-requisitos

- [Node.js](https://nodejs.org/) versão 18 ou superior

## ▶️ Como Executar

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/API_URL.git

# 2. Acesse a pasta do projeto
cd API_URL

# 3. Instale as dependências
npm install

# 4. Inicie o servidor
npm start
```

O servidor estará rodando em **http://localhost:3000**

Para rodar em modo de desenvolvimento (reinicia automaticamente ao salvar):

```bash
npm run dev
```

## 🧪 Como Rodar os Testes

```bash
npm test
```

Os testes utilizam um banco de dados em memória, sem afetar os dados reais.

## 📡 Endpoints da API

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/shorten` | Encurtar uma URL |
| `GET` | `/api/urls` | Listar URLs (com paginação) |
| `GET` | `/api/urls/:code/stats` | Estatísticas detalhadas de uma URL |
| `DELETE` | `/api/urls/:code` | Deletar uma URL encurtada |
| `GET` | `/api/info` | Informações gerais da API |
| `GET` | `/:code` | Redirecionar para a URL original |

### Exemplo de uso

**Encurtar uma URL:**

```bash
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com", "custom_alias": "gh"}'
```

**Resposta:**

```json
{
  "id": 1,
  "original_url": "https://github.com",
  "short_url": "http://localhost:3000/gh",
  "short_code": "gh",
  "created_at": "2026-03-25 12:00:00"
}
```

## 👥 Autores

- **Carlos Augusto**
- **Lucas Tomé**
- **Victor Abreu**
- **João Emiliano**
