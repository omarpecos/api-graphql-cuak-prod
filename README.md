# Cuak GraphQL API
## Introduction
<p align="center">
  <img src="https://cdn-media-1.freecodecamp.org/images/1*rhpr5EnxrphBwqyTus0jmg.png">
</p>

GraphQL API (NodeJS, Express, Mongoose (mongoDB), Apollo Server) with Queries,Mutations and Subscriptions to be consumed by an Angular app ( app-cuak-angular )

# Usage and Documentation
Visit the <a href="https://api-graphql-cuak.glitch.me/graphql" target="_blank">API</a> to try the Apollo Playground where you can try to do some requests or see the GraphQL schema and the documentation

A simple query you can do there : <br/>
<pre>
  {
    allCuaks(paginate :{}){
            results{
              title
              author {
                username
              }
              image
            }
  }
}</pre>

To perform more queries or try some mutations see the documentation there and maybe you have to register and log in with a valid user to get the token.
When you get the token you may try to set authorization headers for other queries, mutations or subscriptions like this : <br/>
<pre>
  {
    "Authorization" : "TOKEN"
  }
</pre>
