# Guia de Uso

Guia detalhado de uso do Avalia 360 para gestores e colaboradores.

---

## Para Gestores

### 1. Criar Avaliacao

1. Acesse a pagina inicial
2. Selecione seu idioma (PT/EN/ES) no canto superior direito
3. Clique em "Criar Avaliacao"
4. Preencha:
   - Seu nome
   - Seu email
   - Titulo da avaliacao (ex: "Avaliacao Q4 2024 - Time Dev")

### 2. Adicionar Membros da Equipe

Voce tem duas opcoes:

**Opcao A - Manual:**
- Clique em "Adicionar Membro"
- Preencha nome e email de cada membro
- Adicione no minimo 2 membros

**Opcao B - Upload de Excel:**
- Clique em "Baixar Template Excel"
- Abra o arquivo `template-avaliacao-360.xlsx`
- Preencha com os dados da equipe:

| Nome | Email |
|------|-------|
| Joao Silva | joao.silva@empresa.com |
| Maria Santos | maria.santos@empresa.com |
| Pedro Oliveira | pedro@empresa.com |

- Salve o arquivo
- Clique em "Upload Excel"
- Arraste ou selecione o arquivo preenchido
- O sistema validara automaticamente

**Validacoes Automaticas do Excel:**
- Formato de emails validos
- Emails duplicados
- Campos vazios
- Minimo de 2 membros
- Limite recomendado: 50 membros
- Formatos aceitos: `.xlsx` (Excel 2007+) e `.xls` (Excel 97-2003)

### 3. Enviar Convites

- Clique em "Criar e Enviar Convites"
- Todos os membros receberao um email automaticamente
- Voce recebera:
  - **Token de acesso** (UUID) - Guarde com seguranca
  - **Link de acompanhamento** - Para ver o progresso
  - Lista com todos os codigos de acesso dos membros

### 4. Acompanhar Progresso

- Use o link de acompanhamento
- Visualize:
  - **Progresso geral**: "15/20 avaliacoes concluidas"
  - **Progresso individual**: Status de cada membro (completo ou pendente)
- Atualize em tempo real conforme colaboradores completam

### 5. Ver Resultados

Quando todos completarem todas as avaliacoes:
- Clique em "Ver Resultados"
- Visualize resultados por pessoa:
  - Media geral (1-5)
  - Desempenho por pergunta (Satisfacao, Proatividade, Qualidade, Trabalho em Equipe)
  - Todos os comentarios recebidos (anonimos)
- Compare com graficos visuais

---

## Para Colaboradores

### 1. Acessar Avaliacao

- Abra o email recebido
- Clique no link da avaliacao
- Insira o codigo de acesso (6 digitos)

### 2. Avaliar os Membros da Equipe

- Voce vera a lista de todos os membros (exceto voce)
- Para cada pessoa, voce deve:
  - Responder 4 perguntas objetivas (escala 1-5):
    - Nivel de satisfacao
    - Proatividade
    - Qualidade das entregas
    - Trabalho em equipe
  - Adicionar comentarios sobre pontos positivos
  - Adicionar comentarios sobre pontos de melhoria
- Acompanhe seu progresso: "2/4 avaliacoes concluidas"

### Escala de Respostas

| Nota | Significado |
|------|-------------|
| 1 | Abaixo da Expectativa |
| 2 | Em Linha de Melhora |
| 3 | Alinhado com as Expectativas |
| 4 | Acima das Expectativas |
| 5 | Referencia Para Outras Pessoas |

### 3. Salvar e Continuar

- Voce pode salvar parcialmente
- Volte depois com seu codigo de acesso
- Complete todas as avaliacoes pendentes
- So estara 100% completo quando avaliar todos os colegas

### 4. Garantias

- Suas respostas sao totalmente anonimas
- O gestor nao ve quem avaliou quem
- Apenas medias e comentarios consolidados sao exibidos
- Dados criptografados com AES-256
