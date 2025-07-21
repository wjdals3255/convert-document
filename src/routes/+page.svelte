<script lang="ts">
  import { post, get } from '$lib/fetch'
  import { onMount } from 'svelte'
  import toast from 'svelte-french-toast'

  // 인증 관련 상태
  let isAuthenticated = false
  let username = ''
  let password = ''
  let loginError = ''

  // JWT 토큰 체크
  onMount(() => {
    const token = localStorage.getItem('jwt')
    const expiresAt = localStorage.getItem('jwt_expires_at')
    if (token && expiresAt) {
      const now = Date.now()
      if (now < Number(expiresAt)) {
        isAuthenticated = true
      } else {
        // 만료됨
        localStorage.removeItem('jwt')
        localStorage.removeItem('jwt_expires_at')
        isAuthenticated = false
      }
    }
  })

  async function handleLogin() {
    try {
      const res = await fetch(`${import.meta.env.VITE_PUBLIC_BASE_API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      if (!res.ok) throw new Error('로그인 실패')
      const data = await res.json()
      localStorage.setItem('jwt', data.token)
      // 1시간 뒤 만료
      localStorage.setItem('jwt_expires_at', (Date.now() + 60 * 60 * 1000).toString())
      isAuthenticated = true
      loginError = ''
      toast.success('로그인 성공!')
    } catch (e) {
      loginError = '아이디 또는 비밀번호가 올바르지 않습니다.'
      toast.error('로그인 실패')
    }
  }

  // 파일 업로드 관련 상태
  let fileInput: HTMLInputElement
  let selectedFile: File | null = null
  let isUploading = false

  // 변환 데이터 리스트
  let convertList: Array<{
    id: string
    convertedAt: Date
    convertedUrl: string
    documentName: string
    retryUrl: string
    status: 'completed' | 'failed'
  }> = []

  // 샘플 데이터 (나중에 실제 벡터 DB에서 가져올 예정)
  onMount(() => {})

  // 파일 선택 핸들러
  async function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement
    if (target.files && target.files[0]) {
      const file = target.files[0]
      console.log('프론트엔드 파일명:', file.name)
      const allowedExts = ['.hwp', '.hwpx']
      const fileName = file.name.toLowerCase()
      if (!allowedExts.some((ext) => fileName.endsWith(ext))) {
        alert('HWP, HWPX 파일만 업로드 가능합니다.')
        return
      }
      const formData = new FormData()
      formData.append('file', file)
      isUploading = true
      try {
        // 내 서버의 /upload 엔드포인트로 파일 업로드
        const result = await post<any>('/upload', formData)
        // result.success, result.filename, result.savedFilename, result.path 등 활용 가능
        // 리스트는 조회 버튼을 눌렀을 때만 갱신하므로 여기서는 추가하지 않음
        if (fileInput) fileInput.value = ''
        toast.success('파일 업로드가 완료되었습니다!')
      } catch (e) {
        toast.error('업로드 실패')
      } finally {
        isUploading = false
      }
    }
  }

  // 변환 결과 리스트 조회 함수
  async function fetchConvertResults() {
    try {
      const result = await get<any>('/convert-results')
      if (!result.success) {
        throw new Error('API 실패')
      }
      convertList = result.results.map((item: any) => ({
        id: item.document_id?.toString() ?? Date.now().toString(),
        convertedAt: new Date(item.converted_at),
        convertedUrl: item.converted_file_url,
        documentName: item.document_name,
        retryUrl: item.retry_url,
        status: item.status === 'completed' || item.status === 'success' ? 'completed' : 'failed'
      }))
      toast.success('리스트를 불러왔습니다!')
    } catch (e) {
      toast.error('리스트 조회 실패')
    }
  }

  // 파일 크기 포맷팅
  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 날짜 포맷팅
  function formatDate(date: Date): string {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  async function handleRetry(url: string) {
    try {
      isUploading = true
      try {
        // /retry-convert로 POST 요청 (JSON)
        const result = await post<any>('/retry-convert', { url })
        const newItem = {
          id: result.document_id?.toString() ?? Date.now().toString(),
          convertedAt: new Date(result.converted_at ?? Date.now()),
          convertedUrl: result.converted_file_url ?? '',
          documentName: result.filename ?? '',
          retryUrl: result.retry_url ?? '',
          status: result.success ? ('completed' as const) : ('failed' as const)
        }
        convertList = [newItem, ...convertList]
        toast.success('재시도 업로드가 완료되었습니다!')
      } catch (e) {
        toast.error('재시도 업로드 실패')
      } finally {
        isUploading = false
      }
    } catch (e) {
      toast.error('재시도 업로드 실패')
    }
  }
</script>

<svelte:head>
  <title>용역 계약 파일 업로드</title>
</svelte:head>

{#if !isAuthenticated}
  <div class="auth-modal">
    <div class="login-box">
      <h2 class="login-title">로그인</h2>
      <input
        class="login-input"
        type="text"
        bind:value={username}
        placeholder="아이디"
        on:keydown={(e) => {
          if (e.key === 'Enter') handleLogin()
        }}
      />
      <input
        class="login-input"
        type="password"
        bind:value={password}
        placeholder="비밀번호"
        on:keydown={(e) => {
          if (e.key === 'Enter') handleLogin()
        }}
      />
      {#if loginError}
        <div class="login-error">{loginError}</div>
      {/if}
      <button class="login-btn" on:click={handleLogin}> 로그인 </button>
    </div>
  </div>
{:else}
  <div class="main-page__content">
    <h1 class="main-page__title">용역 계약 파일 업로드</h1>
    <div class="center-container">
      <input type="file" accept=".hwp,.hwpx" bind:this={fileInput} on:change={handleFileSelect} style="display: none;" />
      <button class="btn attach-btn" on:click={() => fileInput.click()} disabled={isUploading}>
        {isUploading ? '업로드 중...' : '파일 첨부'}
      </button>
      <button class="btn list-btn" on:click={fetchConvertResults}>리스트 조회</button>
    </div>
    <div class="vector-table-mock">
      <table>
        <thead>
          <tr>
            <th>파일명</th>
            <th>컨버팅 일자</th>
            <th>변환된 파일</th>
            <th>재시도 URL</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          {#each convertList as item}
            <tr>
              <td>{item.documentName}</td>
              <td>{formatDate(item.convertedAt)}</td>
              <td>
                {#if item.convertedUrl}
                  <a href={item.convertedUrl} target="_blank" class="converted-link">PDF파일</a>
                {/if}
              </td>
              <td>
                {#if item.retryUrl && item.status === 'failed'}
                  <button class="retry-btn" on:click={() => handleRetry(item.retryUrl)}> 재시도 </button>
                {/if}
              </td>
              <td class="status-td {item.status}">{item.status === 'completed' ? '완료' : '실패'}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
{/if}
