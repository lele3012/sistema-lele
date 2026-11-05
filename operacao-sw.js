// Lelé Operação — funcionamento sem internet.
// Atua SOMENTE nas páginas que começam com "operacao" (escopo definido no
// registro). Não interfere no sistema principal (index.html).
// - Página da operação: busca na internet primeiro; sem sinal, usa a cópia salva.
// - Bibliotecas do Firebase (gstatic.com, com versão fixa): usa a cópia salva.
// - Banco de dados e login: nunca passam por aqui (o Firebase cuida do offline).
var CACHE = 'lele-operacao-v1';
var ARQUIVOS = [
  'operacao.html', 'operacao-manifest.json', 'operacao-icon-192.png', 'operacao-icon-512.png',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js'
];
self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){
    return Promise.all(ARQUIVOS.map(function(u){ return c.add(new Request(u, {cache:'reload'})).catch(function(){}); }));
  }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.filter(function(k){ return k.indexOf('lele-operacao-')===0 && k!==CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);
  // Bibliotecas do Firebase com versão fixa: cópia salva primeiro
  if(url.hostname === 'www.gstatic.com' && url.pathname.indexOf('/firebasejs/9.23.0/') === 0){
    e.respondWith(caches.match(req).then(function(r){ return r || fetch(req).then(function(resp){
      var cp = resp.clone(); caches.open(CACHE).then(function(c){ c.put(req, cp); }); return resp; }); }));
    return;
  }
  if(url.origin !== self.location.origin) return; // banco, login etc.: não mexe
  // Arquivos da operação: internet primeiro, cópia salva se estiver sem sinal
  e.respondWith(fetch(req).then(function(resp){
    if(resp && resp.ok){ var cp = resp.clone(); caches.open(CACHE).then(function(c){ c.put(req, cp); }); }
    return resp;
  }).catch(function(){
    return caches.match(req, {ignoreSearch:true}).then(function(r){ return r || caches.match('operacao.html'); });
  }));
});
