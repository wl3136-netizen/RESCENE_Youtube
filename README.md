# RESCENE NEW CLIPS

`#리센느`, `#원이`, `#미나미`, `#리브`, `#메이`, `#제나`의 신규 YouTube 영상을 매일 모아 보여주는 반응형 GitHub Pages 사이트입니다.

## 설치

1. 이 폴더를 GitHub 새 저장소의 `main` 브랜치에 올립니다.
2. Google Cloud Console에서 **YouTube Data API v3**를 활성화하고 API Key를 만듭니다.
3. GitHub 저장소의 `Settings → Secrets and variables → Actions`에서 `YOUTUBE_API_KEY`라는 Repository secret을 등록합니다.
4. `Settings → Pages → Build and deployment → Source`를 **GitHub Actions**로 선택합니다.
5. `Actions` 탭에서 **Update YouTube and deploy Pages**를 한 번 수동 실행합니다.

이후 약 2시간 간격으로 신규 영상이 자동 반영됩니다. GitHub Actions 예약 실행은 서버 상황에 따라 다소 늦어질 수 있습니다. 첫 실행은 최근 7일, 이후 실행은 직전 업데이트 이후의 영상만 조회합니다. 화면에는 최근 60일 영상이 유지되며, 열어둔 웹 화면은 5분마다 새 데이터가 있는지 자동 확인합니다.

## 숏폼 분류 기준

YouTube Data API는 영상의 세로 화면 여부를 제공하지 않으므로 재생시간이 **3분 이하이면 숏폼**, 그보다 길면 롱폼으로 분류합니다.
