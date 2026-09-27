# Chatify Hub

https://www.chatblog.site/

Nataka nitengenezee hii website yangu kama ilivo usibadilishe chochote 

Muhimu:  Button zote ziwe zinafanya kazi

 Notifications toast na sounds ziwepo

Chat

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://chatblogs.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/efcbc38f-92e1-43bf-bbfc-29d94100b8d6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```


## ChatBlog payment/register integration
- Uses the existing shared Chatpesa Supabase tables (`profiles`, `payment_submissions`, `notifications`, etc.).
- No `DROP`, `ALTER`, or new schema migration is included in ChatBlog, so the existing shared database is not modified by this project.
- Registration fee: TZS 14,500.
- Manual payment: Lipa Namba 251161660 — ASSERT BRIDGE.
- Automatic payment: Fimipay.
- Required server environment variables are in `.env.example`. Keep `SUPABASE_SERVICE_ROLE_KEY` and `FIMIPAY_API_KEY` server-side.
- The payment page intentionally has no USSD step instructions.
