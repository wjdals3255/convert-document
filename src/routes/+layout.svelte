<script lang="ts">
  import '../app.css'
  import { Toaster } from 'svelte-french-toast'

  let { children } = $props()
  export const prerender = true
</script>

{@render children()}
<Toaster />
