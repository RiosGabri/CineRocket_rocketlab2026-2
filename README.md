# RocketLab 2026.2 — Sistema de Avaliação de Filmes

Atividade DEV do Rocket Lab 2026.2 (Visagio): um sistema de avaliação de
filmes inspirado em plataformas como o Letterboxd, com catálogo paginado,
busca por título, cadastro/edição/remoção de filmes e avaliações (nota de
0 a 10 + resenha) por usuário. Construído sobre a estrutura-base fornecida
(modelo relacional em SQLAlchemy 2.0, migrações com Alembic).

> **Nota:** `RocketLab` é apenas o nome de referência desta base. O diretório,
> nome do pacote, título da API e arquivo do banco podem ser renomeados para o
> que preferirem; eles não representam uma exigência da
> estrutura-base.

## Estrutura

```text
.
├── backend/
│   ├── app/
│   │   ├── api/v1/        # routers (movies, genres)
│   │   ├── core/          # configurações e logging
│   │   ├── db/            # Base ORM, engine e sessões
│   │   ├── movies/        # modelos, schemas e serviços do domínio de filmes
│   │   └── scripts/       # seed.py — carga dos CSVs no banco
│   ├── migrations/        # ambiente e revisões Alembic
│   ├── data/               # CSVs de origem (não versionados; veja "Carga de dados")
│   └── tests/
├── frontend/
│   └── src/
│       ├── api/           # cliente axios e chamadas à API (movies, genres)
│       ├── components/    # componentes reutilizáveis (ExpandableList, ReviewForm)
│       ├── constants/     # tradução de gêneros para português
│       ├── pages/         # MoviesList, MovieDetail, MovieForm
│       ├── types/         # tipos TS espelhando os schemas do backend
│       └── utils/         # normalização de texto (títulos com aspas do CSV)
└── README.md
```

## Backend

Requer Python 3.11 ou superior.

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -e ".[dev]"
cp .env.example .env
.venv/bin/alembic upgrade head
.venv/bin/uvicorn app.main:app --reload
```

A API mínima ficará disponível em `http://localhost:8000`; use
`http://localhost:8000/docs` para a documentação automática. O endpoint
`GET /health` permite conferir se a aplicação iniciou corretamente.

## Banco de dados e migrações

O modelo usa um esquema estrela para o catálogo de filmes:

- dimensões de filmes, gêneros, pessoas, produtoras e resumo de avaliações;
- fato de desempenho financeiro e de engajamento;
- tabelas de associação N:N entre filmes, gêneros, produtoras e pessoas;

O schema corresponde aos nove arquivos CSV atuais da camada Diamond, com a
adição de `movie_reviews`: uma avaliação individual por linha, na escala 0–10.
A tabela aceita diretamente as colunas `sk_movie_review_id`, `sk_movie_id`,
`nome`, `nota` e `comentario` do CSV enviado separadamente. `created_at` é
gerado pelo banco. O contexto generativo não faz parte desta base.

Para usar avaliações, importe primeiro os filmes em `dim_movies` e depois o
CSV de `movie_reviews` — veja a seção "Carga de dados (seed)" abaixo.

As tabelas são criadas exclusivamente pelo Alembic. Para evoluir os modelos,
crie uma revisão e aplique-a:

```bash
cd backend
.venv/bin/alembic revision --autogenerate -m "descreva a alteração"
.venv/bin/alembic upgrade head
```

O banco padrão é SQLite local em `backend/rocketlab.db`. Ajuste
`DATABASE_URL` no arquivo `.env` para usar outro banco compatível.

## Carga de dados (seed)

O `rocketlab.db` versionado neste repositório já vem populado com um
subconjunto dos 4000 filmes mais votados no TMDB (e as avaliações
correspondentes), pronto pra uso imediato após `alembic upgrade head`. Para
carregar o catálogo completo a partir dos CSVs, use `--limit` com um valor
maior ou omita a flag:

```bash
.venv/bin/python -m app.scripts.seed --reset --limit 4000  # ou outro valor
.venv/bin/python -m app.scripts.seed --reset                # catálogo completo
```

O CSV `movies_reviews.csv` é opcional na primeira carga: se ele não estiver
na pasta de dados, o seed carrega o catálogo normalmente e avisa que pulou
as avaliações. Para completá-las depois, basta colocar o CSV na pasta e
rodar o comando de novo **sem** `--reset`:

```bash
.venv/bin/python -m app.scripts.seed
```

Isso só funciona uma vez por carga — se `movie_reviews` já tiver linhas,
o comando recusa para não duplicar avaliações; nesse caso, use `--reset`
para recarregar tudo do zero.

## Escopo do cadastro de filmes

O cadastro/edição de filmes pela API segue os campos do enunciado
(título, diretor, ano, gênero, sinopse); produtoras são populadas
apenas pelo seed e não são editáveis pela aplicação.

## Frontend

Requer Node.js 20 ou superior (versões anteriores não são suportadas pelas
ferramentas de build atuais).

```bash
cd frontend
npm install
cp .env.example .env   # ajuste VITE_API_URL se o backend não estiver em localhost:8000
npm run dev
```

A aplicação fica disponível em `http://localhost:5173`. O backend precisa
estar rodando (veja a seção "Backend" acima) — o CORS já está configurado
para aceitar requisições dessa origem por padrão.

### Telas

- **Catálogo** (`/`) — lista paginada de filmes, com busca por título
  (debounce de 400ms) e link para cadastro de um novo filme.
- **Detalhe do filme** (`/movies/:id`) — informações completas, nota média
  dos usuários (com fallback de TMDB/IMDB quando disponíveis), listas de
  elenco/direção/roteiro/produtoras (truncadas com "ver mais" para filmes
  com muitos créditos), histórico de avaliações paginado, formulário para
  adicionar uma nova avaliação, e ações de editar/excluir o filme.
- **Formulário de filme** (`/movies/new` e `/movies/:id/edit`) — mesmo
  componente para criação e edição; em modo de edição, carrega e reenvia
  sem alteração os campos que não têm entrada própria no formulário
  (data de lançamento, duração, status e imagem de fundo), para não
  apagar esses dados ao salvar uma edição parcial.

### Limitações conhecidas

- O formulário só edita um diretor por filme (`diretor: string`, não uma
  lista). Filmes do catálogo original com mais de um diretor cadastrado
  mostram apenas o primeiro no formulário; salvar uma edição nesse caso
  reduz o filme a um único diretor.
- Títulos e gêneros vêm diretamente dos CSVs de origem: alguns títulos têm
  aspas duplicadas remanescentes do dado original (normalizadas na exibição,
  mas não no banco) e os nomes de gênero fora dos 19 padrão do TMDB aparecem
  em inglês (sem tradução mapeada).