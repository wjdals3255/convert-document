import adapter from '@sveltejs/adapter-static'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://svelte.dev/docs/kit/integrations
  // for more information about preprocessors
  preprocess: vitePreprocess(),

  kit: {
    // 정적 사이트 배포를 위해 adapter-static 사용
    adapter: adapter(),
    alias: {
      '#auth': 'src/lib/auth/index.ts',
      '#fetch': 'src/lib/fetch/index.ts',
      '#dayjs': 'src/lib/dayjs/index.ts',
      '@/*': 'src/*'
    }
  }
}

export default config
