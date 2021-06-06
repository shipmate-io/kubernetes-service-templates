<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
    <router-view/>
    <ul>
      <li>
        <router-link to="/">Go to Foo</router-link>
      </li>
      <li>
        <router-link to="/bar">Go to Bar</router-link>
      </li>
    </ul>
    The application key is: {{ key }}
  </div>
</template>

<script>
    export default {
        name: 'App',
        computed: {
            key() {
                return process.env.VUE_APP_KEY
            }
        }
    }
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
h1 {
  margin: 40px 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
