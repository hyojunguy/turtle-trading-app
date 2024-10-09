# 터틀 트레이딩 주식 분석 애플리케이션

터틀 트레이딩 전략을 기반으로 주식 데이터를 분석하고 매매 신호를 제공하는 React 애플리케이션입니다. 이 애플리케이션은 Alpha Vantage API를 사용하여 실시간 주식 데이터를 가져오며, N 값 계산과 매매 신호 생성을 통해 사용자에게 유용한 정보를 제공합니다.

## 데모

![애플리케이션 스크린샷](./screenshot.png)

## 목차

- [터틀 트레이딩 주식 분석 애플리케이션](#터틀-트레이딩-주식-분석-애플리케이션)
  - [데모](#데모)
  - [목차](#목차)
  - [기능](#기능)
  - [설치 및 실행](#설치-및-실행)
    - [필수 조건](#필수-조건)
    - [프로젝트 복제](#프로젝트-복제)
    - [의존성 설치](#의존성-설치)
    - [환경 변수 설정](#환경-변수-설정)
    - [애플리케이션 실행](#애플리케이션-실행)
  - [사용 방법](#사용-방법)
  - [배포](#배포)
    - [Vercel을 통한 배포](#vercel을-통한-배포)
    - [Netlify를 통한 배포](#netlify를-통한-배포)
  - [구성 요소](#구성-요소)
    - [주요 라이브러리 및 프레임워크](#주요-라이브러리-및-프레임워크)
    - [디렉토리 구조](#디렉토리-구조)
  - [기여 방법](#기여-방법)
  - [라이선스](#라이선스)
  - [문의](#문의)

## 기능

- **실시간 주식 데이터 가져오기**: Alpha Vantage API를 사용하여 실시간 주식 데이터를 가져옵니다.
- **N 값 계산**: 터틀 트레이딩 전략에 필요한 N 값을 계산합니다.
- **매매 신호 제공**: 최근 주가 데이터를 분석하여 매수, 매도, 보유 신호를 제공합니다.
- **데이터 시각화**: Recharts 라이브러리를 사용하여 주가 데이터를 차트로 시각화합니다.
- **사용자 친화적인 인터페이스**: React와 Tailwind CSS를 사용하여 직관적인 UI를 제공합니다.

## 설치 및 실행

### 필수 조건

- **Node.js** (v14 이상)
- **Yarn**
- **Alpha Vantage API 키**: [여기](https://www.alphavantage.co/)에서 무료로 발급받을 수 있습니다.

### 프로젝트 복제

터미널에서 다음 명령어를 실행하여 프로젝트를 복제합니다:

```bash
git clone https://github.com/yourusername/turtle-trading-app.git
cd turtle-trading-app
```

### 의존성 설치

프로젝트 디렉토리에서 다음 명령어를 실행하여 필요한 패키지를 설치합니다:

```bash
yarn install
```

### 환경 변수 설정

프로젝트 루트 디렉토리에 `.env` 파일을 생성하고 다음 내용을 추가합니다:

```env
REACT_APP_ALPHA_VANTAGE_API_KEY=YOUR_ALPHA_VANTAGE_API_KEY
```

`YOUR_ALPHA_VANTAGE_API_KEY`를 실제로 발급받은 API 키로 대체하세요.

> **주의**: API 키는 외부에 노출되지 않도록 `.gitignore` 파일에 `.env` 파일이 포함되어 있는지 확인하세요.

### 애플리케이션 실행

```bash
yarn start
```

브라우저에서 [http://localhost:3000](http://localhost:3000)에 접속하여 애플리케이션을 확인하세요.

## 사용 방법

1. 상단 입력란에 분석하고자 하는 주식의 심볼을 입력합니다. (예: `AAPL` for Apple Inc.)
2. **분석** 버튼을 클릭합니다.
3. 잠시 후 주식의 N 값과 매매 신호가 화면에 표시됩니다.
4. 차트와 테이블을 통해 주가 변동과 매매 신호를 확인할 수 있습니다.

## 배포

애플리케이션을 배포하려면 다음 중 하나의 서비스를 사용할 수 있습니다:

### Vercel을 통한 배포

1. [Vercel](https://vercel.com/)에 가입하고 GitHub 계정을 연동합니다.
2. 프로젝트를 GitHub에 푸시합니다.
3. Vercel 대시보드에서 **New Project**를 선택하고 해당 리포지토리를 가져옵니다.
4. 환경 변수를 설정합니다:
   - `REACT_APP_ALPHA_VANTAGE_API_KEY`를 환경 변수로 추가합니다.
5. 배포가 완료되면 제공된 URL로 애플리케이션에 접근할 수 있습니다.

### Netlify를 통한 배포

1. [Netlify](https://www.netlify.com/)에 가입하고 GitHub 계정을 연동합니다.
2. 프로젝트를 GitHub에 푸시합니다.
3. Netlify 대시보드에서 **New site from Git**을 선택하고 해당 리포지토리를 가져옵니다.
4. **Build Settings**에서 빌드 커맨드를 `yarn build`, 배포 디렉토리를 `build`로 설정합니다.
5. 환경 변수를 설정합니다:
   - `REACT_APP_ALPHA_VANTAGE_API_KEY`를 환경 변수로 추가합니다.
6. 배포가 완료되면 제공된 URL로 애플리케이션에 접근할 수 있습니다.

## 구성 요소

### 주요 라이브러리 및 프레임워크

- **React**: 사용자 인터페이스를 구축하기 위한 JavaScript 라이브러리.
- **Tailwind CSS**: 유틸리티 기반의 CSS 프레임워크로, 빠르고 효율적인 스타일링을 지원합니다.
- **Recharts**: React를 위한 차트 라이브러리로, 데이터 시각화를 도와줍니다.
- **Alpha Vantage API**: 실시간 및 과거 주식 데이터를 제공하는 API 서비스.

### 디렉토리 구조

```
turtle-trading-app/
├── public/
├── src/
│   ├── components/
│   │   ├── TurtleTradingApp.js
│   │   └── CustomTable.js
│   ├── App.js
│   ├── index.js
│   └── index.css
├── .env
├── package.json
├── yarn.lock
├── tailwind.config.js
└── README.md
```

## 기여 방법

1. 이 리포지토리를 포크합니다.
2. 새로운 브랜치를 생성합니다: `git checkout -b feature/your-feature-name`
3. 변경 사항을 커밋합니다: `git commit -m 'Add some feature'`
4. 브랜치에 푸시합니다: `git push origin feature/your-feature-name`
5. Pull Request를 제출합니다.

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](./LICENSE) 파일을 참고하세요.

## 문의

프로젝트에 대한 문의나 제안 사항이 있으시면 다음 이메일로 연락주시기 바랍니다:

- 이메일: [your.email@example.com](mailto:your.email@example.com)
- GitHub 이슈: [Issues](https://github.com/yourusername/turtle-trading-app/issues)

---

**주의사항**:

- **API 호출 제한**: Alpha Vantage API의 무료 플랜은 분당 5회, 하루 500회로 호출이 제한되어 있습니다. 과도한 요청은 애플리케이션 동작에 영향을 줄 수 있으니 주의하세요.
- **데이터 정확성**: 제공되는 데이터와 매매 신호는 투자 결정의 참고 자료일 뿐이며, 투자 손실에 대한 책임은 사용자에게 있습니다.
- **보안**: API 키와 같은 민감한 정보는 절대 공개 저장소나 클라이언트 코드에 포함시키지 마세요.

---

감사합니다! 즐거운 개발 되세요.