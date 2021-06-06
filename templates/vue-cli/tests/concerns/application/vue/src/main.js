import Vue from 'vue'
import VueRouter from 'vue-router'
Vue.use(VueRouter)

import App from './App.vue'

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
  router: new VueRouter({
    mode: 'history',
    routes: [
      { path: '/', component: { template: '<h1>You are viewing page: foo</h1>' } },
      { path: '/bar', component: { template: '<h1>You are viewing page: bar</h1>' } },
      { path: '/404', component: { template: '<h1>Oops, page not found!</h1>' } },
      { path: '*', redirect: '/404' }
    ]
  }),
}).$mount('#app')
