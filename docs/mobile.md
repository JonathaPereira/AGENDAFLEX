# Ross no Android e iOS — estrutura inicial

A aplicação React/Vite agora possui projetos nativos Capacitor 8 em `apps/web/android` e `apps/web/ios`. O identificador inicial é `com.agendaflex.ross`. As plataformas foram geradas e os assets sincronizados; isso **não equivale a APK/IPA compilados ou teste em aparelhos**.

## Prévia sem contas

No web app, o link **Ver demonstração para celular**, na tela de login, abre `/mobile`. A prévia mantém o protótipo HTML dentro de uma tela com retorno ao login. É uma apresentação dos cenários de cliente, empresário e barbeiro; não foi feita a migração dos módulos do HTML para domínio/persistência React.

Para preparar os projetos nativos com a prévia:

```sh
pnpm install --frozen-lockfile
pnpm mobile:prepare
```

Esse comando gera um build `mobile-preview` e copia os assets para Android/iOS. Ele desativa explicitamente o Supabase na compilação e mostra um aviso. Não existe login real, cobrança ou envio de e-mail nessa prévia, mesmo que o `.env` contenha o projeto real. As alterações do cenário ficam em memória e somem ao recarregar.

Os assets copiados e configs geradas não são versionados. Depois de clonar ou mudar telas, execute novamente `mobile:prepare`. O diretório `dist` é compartilhado entre os modos; sempre use o comando de preparo correspondente antes de compilar no IDE.

## Abrir no Android

Instale Android Studio e o SDK Android 36 em seu computador (ferramentas gratuitas). O projeto usa minSdk 24, target/compileSdk 36 e requer JDK compatível com o Android Gradle Plugin gerado; use o JDK do Android Studio atual.

```sh
pnpm mobile:prepare
pnpm mobile:android
```

No Android Studio, deixe o Gradle sincronizar e escolha um emulador ou celular com depuração USB habilitada. Use **Run** para instalar uma versão de desenvolvimento. A compilação Android e instalação não foram executadas neste ambiente, que não possui SDK Android configurado. O diagnóstico do Capacitor confere arquivos/versões, não substitui uma compilação.

## Abrir no iPhone

É necessário um Mac com Xcode e suporte ao iOS configurado. O projeto usa Swift Package Manager.

```sh
pnpm mobile:prepare
pnpm mobile:ios
```

Selecione um simulador no Xcode e execute. Testar em iPhone físico depende da assinatura e das regras atuais da Apple; não foi habilitado programa pago. Linux não compila o projeto iOS: Xcode e testes no simulador/aparelho continuam pendentes.

## Versão conectada, em etapa posterior

Contas de empresário/funcionários foram adiadas. A API web local em `localhost:3001` não fica acessível pelo mesmo endereço em um celular. Antes de preparar o modo conectado, é necessário disponibilizar a API em HTTPS e preencher `VITE_MOBILE_API_URL` no `.env`, além da URL/chave pública Supabase já documentadas. Essa entrega não contrata nem publica hospedagem.

```sh
pnpm mobile:prepare:connected
```

O build é recusado se a API mobile não estiver configurada em HTTPS, ou se apontar para localhost/loopback. Nesse modo o protótipo `demo.html` é retirado do pacote e a rota de prévia redireciona ao login. As telas operacionais reais ainda precisam ser migradas/conectadas antes de liberar uso comercial. Um build com URL fictícia serve somente para conferir empacotamento, nunca como evidência de conexão real.

A API aceita as origens nativas `capacitor://localhost` e `https://localhost`, além da origem web configurada. CORS não autentica o usuário: `/me` continua exigindo JWT verificado e os demais casos de uso precisarão de autorização por tenant.

## Links de confirmação e recuperação

Os projetos registram o esquema `com.agendaflex.ross`. Para testar Auth no aplicativo conectado, cadastrar no Supabase Authentication → URL Configuration:

- `com.agendaflex.ross://auth/callback`
- `com.agendaflex.ross://redefinir-senha`

O frontend usa essas URLs somente no nativo; no navegador continua usando a origem web. O bridge aceita apenas os dois destinos, encaminha código/erro e não aceita papel, token ou URL de redirecionamento como autorização. O código continua sendo trocado no Supabase via PKCE e a API valida a sessão. A abertura a frio e com app aberto ainda precisam de teste Android/iOS real. Antes de produção, preferir links HTTPS verificados (App Links/Universal Links) e revisar persistência segura/revogação da sessão.

## Limites e próximos passos

- Ícones/splash nativos ainda são os do template; a logo Ross está nas telas. Finalizar identidade nativa antes de distribuir.
- Não há APK/IPA, assinatura de loja, publicação ou aprovação em App Store/Google Play. Não foram criadas contas pagas; taxas de lojas exigirão decisão futura do usuário.
- Não há upload de foto nem gateway de pagamento nesta etapa. Essas integrações continuam pendentes.
- O protótipo é responsivo e possui retorno ao login; ele não é um app comercial com banco sincronizado ou agenda real.
- Validar teclado, botão voltar, acessibilidade, safe areas, sessão e links em aparelhos. Não confundir emulação Chromium de tela pequena com teste no Safari/iOS.

Verificações automatizadas: `pnpm test`, `pnpm test:e2e:auth` (serviços simulados), `pnpm test:e2e:mobile` (build da prévia, sem rede real). A compilação dos assets/cópia nativa é feita por `pnpm mobile:prepare`.

## Primeiro teste do usuário: Windows + Android

1. Baixar Android Studio pelo site oficial <https://developer.android.com/studio> e concluir o assistente, incluindo o Android SDK. Em SDK Manager, conferir Android SDK Platform 36 e ferramentas de build correspondentes.
2. Instalar Node.js 24. Na pasta do repositório atualizado, usar pnpm 10.11.0 (por Corepack ou `npm install -g pnpm@10.11.0`).
3. No PowerShell, na pasta que contém o `package.json` principal: `pnpm install --frozen-lockfile`, depois `pnpm mobile:prepare` e `pnpm mobile:android`.
4. No Android Studio, aguardar o Gradle terminar. Selecionar um emulador ou o celular pessoal conectado por USB com depuração USB autorizada pelo próprio usuário.
5. Usar o botão Run do Android Studio. O pacote inicia na prévia com dados fictícios, sem contas e sem cobranças. Para gerar um instalador de teste, usar a opção de gerar APK de desenvolvimento do Android Studio.

Esse roteiro é a orientação para o próximo teste; a instalação/compilação no Windows e no celular do usuário ainda não foram executadas.
