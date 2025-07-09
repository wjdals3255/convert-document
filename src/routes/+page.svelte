<script lang="ts">
  import { post, get } from '$lib/fetch'
  import { onMount } from 'svelte'
  import toast from 'svelte-french-toast'

  // 인증 관련 상태
  let isAuthenticated = false
  let passwordInput = ''
  let passwordError = ''
  const PASSWORD = 'Codex2025!!'

  // 인증 상태를 로컬스토리지에서 불러오기
  onMount(() => {
    if (localStorage.getItem('isAuthenticated') === 'true') {
      isAuthenticated = true
    }
  })

  function handlePasswordSubmit() {
    if (passwordInput === PASSWORD) {
      isAuthenticated = true
      localStorage.setItem('isAuthenticated', 'true')
      passwordError = ''
    } else {
      passwordError = '비밀번호가 올바르지 않습니다.'
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
  <div
    class="auth-modal"
    style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.7);z-index:1000;display:flex;align-items:center;justify-content:center;"
  >
    <div style="background:#222;padding:2rem 2.5rem;border-radius:12px;box-shadow:0 2px 16px #000;min-width:320px;">
      <h2 style="color:#fff;margin-bottom:1.5rem;">비밀번호 입력</h2>
      <input
        type="password"
        bind:value={passwordInput}
        placeholder="비밀번호를 입력하세요"
        style="width:100%;padding:0.75rem 1rem;border-radius:6px;border:none;font-size:1.1rem;"
        on:keydown={(e) => {
          if (e.key === 'Enter') handlePasswordSubmit()
        }}
      />
      {#if passwordError}
        <div style="color:#ff4d4f;margin-top:0.5rem;">{passwordError}</div>
      {/if}
      <button
        style="margin-top:1.5rem;width:100%;padding:0.75rem 0;background:#2563eb;color:#fff;border:none;border-radius:6px;font-size:1.1rem;cursor:pointer;"
        on:click={handlePasswordSubmit}
      >
        확인
      </button>
    </div>
  </div>
{:else}
  <div class="main-page__content">
    <h1 class="main-page__title">용역 계약 파일 업로드</h1>

    <div class="center-container" style="display: flex; flex-direction: row; gap: 1rem; justify-content: center;">
      <input type="file" accept=".hwp,.hwpx" bind:this={fileInput} on:change={handleFileSelect} style="display: none;" />
      <button class="attach-btn" on:click={() => fileInput.click()} disabled={isUploading}>
        {isUploading ? '업로드 중...' : '파일 첨부'}
      </button>
      <button class="attach-btn" style="background: #2563eb; color: #fff;" on:click={fetchConvertResults}>리스트 조회</button>
    </div>

    <!-- 여기엔 벡터디비 리스트 들어갈것 -->
    <div class="vector-table-mock" style="max-width: 900px; margin: 2.5rem auto 0 auto;">
      <table style="width: 100%; color: #fff;">
        <thead>
          <tr>
            <th style="color: #fff;">파일명</th>
            <th style="color: #fff;">컨버팅 일자</th>
            <th style="color: #fff;">변환된 파일</th>

            <th style="color: #fff;">재시도 URL</th>
            <th style="color: #fff;">상태</th>
          </tr>
        </thead>
        <tbody>
          {#each convertList as item}
            <tr>
              <td>{item.documentName}</td>
              <td>{formatDate(item.convertedAt)}</td>
              <td>
                {#if item.convertedUrl}
                  <a href={item.convertedUrl} target="_blank" style="color:#00E34F; text-decoration:underline;">PDF파일</a>
                {/if}
              </td>

              <td>
                {#if item.retryUrl && item.status === 'failed'}
                  <button
                    style="color:#00E34F; text-decoration:underline; background:none; border:none; cursor:pointer;"
                    on:click={() => handleRetry(item.retryUrl)}
                  >
                    재시도
                  </button>
                {/if}
              </td>
              <td style="color: {item.status === 'completed' ? '#00E34F' : '#ff4d4f'}; font-weight: bold;"
                >{item.status === 'completed' ? '완료' : '실패'}</td
              >
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
{/if}
