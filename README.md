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
    - [로컬에서 코드 실행하기 (Yarn 사용)](#로컬에서-코드-실행하기-yarn-사용)
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
- **심볼 선택 기능**: 미국 시가총액 상위 10개 기업의 심볼을 클릭하여 빠르게 분석할 수 있습니다.
- **캐시 적용**: 동일한 종목에 대한 반복적인 API 호출을 방지하기 위해 캐시를 적용하였습니다.

## 설치 및 실행

### 필수 조건

- **Node.js** (v14 이상)
- **Yarn**
- **Alpha Vantage API 키**: [여기](https://www.alphavantage.co/)에서 무료로 발급받을 수 있습니다.

### 로컬에서 코드 실행하기 (Yarn 사용)

1. **Node.js와 Yarn 설치 확인**

   먼저, Node.js와 Yarn이 설치되어 있는지 확인해야 합니다. 터미널에서 다음 명령어를 입력하세요:

   ```bash
   node -v
   yarn -v
   ```

   버전 번호가 표시되면 이미 설치되어 있는 것입니다. 만약 설치되어 있지 않다면 다음과 같이 설치하세요:

   - **Node.js**: [Node.js 공식 웹사이트](https://nodejs.org/)에서 LTS 버전을 다운로드하여 설치합니다.
   - **Yarn**: 터미널에서 다음 명령어를 실행합니다:

     ```bash
     npm install -g yarn
     ```

2. **GitHub 리포지토리 클론**

   GitHub에 `turtle-trading-app` 리포지토리를 이미 생성하셨다면, 해당 리포지토리를 로컬로 클론합니다:

   ```bash
   git clone https://github.com/yourusername/turtle-trading-app.git
   cd turtle-trading-app
   ```

3. **현재 폴더에 React 앱 생성**

   이미 `turtle-trading-app` 폴더가 있으므로, 그 안에서 React 앱을 생성해야 합니다. 현재 디렉토리에 React 앱을 생성하려면 다음 명령어를 사용합니다:

   ```bash
   yarn create react-app .
   ```

   여기서 `.`은 현재 디렉토리를 의미합니다.

4. **필요한 패키지 설치**

   코드에서 사용된 라이브러리를 설치합니다:

   ```bash
   yarn add recharts lucide-react
   ```

   Tailwind CSS 및 기타 UI 컴포넌트를 사용하고 있다면 추가로 설치합니다:

   ```bash
   yarn add -D tailwindcss postcss autoprefixer
   yarn tailwindcss init -p
   ```

5. **Tailwind CSS 설정**

   - `tailwind.config.js` 파일을 수정하여 Tailwind가 소스 파일을 인식하도록 합니다:

     ```javascript
     module.exports = {
       content: ["./src/**/*.{js,jsx,ts,tsx}"],
       theme: {
         extend: {},
       },
       plugins: [],
     };
     ```

   - `src/index.css` 파일에 Tailwind 지시어를 추가합니다:

     ```css
     @tailwind base;
     @tailwind components;
     @tailwind utilities;
     ```

6. **코드 추가**

   - `src` 디렉토리에 `TurtleTradingApp.js` 파일을 생성하고 제공된 코드를 붙여넣습니다.
   - `src/App.js` 파일을 열어 기존 내용을 삭제하고 다음과 같이 수정합니다:

     ```javascript
     import React from 'react';
     import TurtleTradingApp from './TurtleTradingApp';

     function App() {
       return <TurtleTradingApp />;
     }

     export default App;
     ```

7. **API 키 설정**

   Alpha Vantage API를 사용하기 위해서는 API 키를 설정해야 합니다.

   - [Alpha Vantage 공식 웹사이트](https://www.alphavantage.co/)에서 회원가입 후 무료 API 키를 발급받습니다.
   - 프로젝트 루트 디렉토리에 `.env` 파일을 생성하고 다음 내용을 추가합니다:

     ```env
     REACT_APP_ALPHA_VANTAGE_API_KEY=YOUR_ALPHA_VANTAGE_API_KEY
     ```

     `YOUR_ALPHA_VANTAGE_API_KEY`를 실제로 발급받은 API 키로 대체하세요.

     > **주의**: `.env` 파일은 `.gitignore`에 포함되어야 합니다. 이를 통해 API 키가 공개 저장소에 노출되지 않도록 합니다.

8. **`fetchStockData` 함수 수정**

   `TurtleTradingApp.js` 파일에서 API 키를 환경 변수로 가져오도록 수정합니다:

   ```javascript
   const apiKey = process.env.REACT_APP_ALPHA_VANTAGE_API_KEY;
   ```

9. **UI 컴포넌트 설정**

   코드에서 사용된 `Alert`, `Button`, `Input` 등의 컴포넌트는 직접 구현하거나 인기 있는 UI 라이브러리를 사용할 수 있습니다. 예를 들어, **Material-UI**를 사용할 수 있습니다.

   **Material-UI 설치 방법:**

   - 패키지 설치:

     ```bash
     yarn add @mui/material @emotion/react @emotion/styled
     ```

   - 컴포넌트 임포트 및 사용:

     ```javascript
     import Button from '@mui/material/Button';
     import TextField from '@mui/material/TextField';
     import Alert from '@mui/material/Alert';
     // 등등
     ```

10. **애플리케이션 실행**

    설정이 완료되었으면 애플리케이션을 실행합니다:

    ```bash
    yarn start
    ```

    브라우저에서 [http://localhost:3000](http://localhost:3000)에 접속하여 애플리케이션이 정상적으로 동작하는지 확인하세요.

## 사용 방법

1. **심볼 선택**: 상단의 심볼 리스트에서 관심 있는 주식의 심볼을 클릭하거나, 입력란에 직접 주식 심볼을 입력합니다. (예: `AAPL` for Apple Inc.)
2. **분석 실행**: **분석** 버튼을 클릭합니다.
3. **결과 확인**:
   - 오늘의 고가, 저가, TR 값, N 값이 화면에 표시됩니다.
   - 차트와 테이블을 통해 주가 변동과 매매 신호를 확인할 수 있습니다.
4. **초기화**: 새로운 분석을 위해 **초기화** 버튼을 클릭하여 상태를 초기화할 수 있습니다.

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
- **Material-UI (MUI)**: React를 위한 인기 있는 UI 컴포넌트 라이브러리.
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
├── .gitignore
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
- **캐시 사용**: 동일한 종목에 대한 반복적인 API 호출을 방지하기 위해 로컬 스토리지에 데이터를 캐시합니다.

---

감사합니다! 즐거운 개발 되세요.