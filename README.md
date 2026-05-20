# sakura-ai

さくらAI Engine（Kimi-K2.6 / Qwen3-Coder / gpt-oss）を使うためのツール類。

- **MCP Server** — Claude Code / Cursor から Sakura AI を呼び出す
- **OpenCode 設定** — opencode のプロバイダーとして Sakura AI を使う
- **Zed 設定** — Zed の Agent パネルで Sakura AI を使う

Mac / Ubuntu で動作確認済み。Windows は未確認。

---

## 料金比較

### さくらAI Engine（円建て・為替リスクなし）

| モデル | 入力 (100万トークン) | 出力 (100万トークン) | 用途 |
|--------|---------------------|---------------------|------|
| Kimi-K2.6 | **60円** | 300円 | 汎用・コードレビュー |
| Qwen3-Coder-480B | **30円** | 250円 | コード生成 |
| gpt-oss-120b | **15円** | 75円 | 汎用・高速 |
| llm-jp-3.1-8x13b | **15円** | 75円 | 日本語特化 |

無料枠：月3,000リクエスト（チャット補完）。超過分のみ従量課金。

### 他社APIとの比較（参考）

※ 1USD = 150円換算。料金は変動するため最新情報は各公式ページを確認。

| モデル | 入力 (100万トークン) | 出力 (100万トークン) | 無料枠 |
|--------|---------------------|---------------------|--------|
| **Kimi-K2.6（さくら）** | **60円** | **300円** | あり |
| GPT-4o (OpenAI) | 375円 | 1,500円 | なし |
| GPT-4o mini (OpenAI) | 23円 | 90円 | なし |
| o4-mini (OpenAI) | 165円 | 660円 | なし |
| Claude Sonnet 4.5 (Anthropic) | 450円 | 2,250円 | 少量あり |
| Claude Haiku 4.5 (Anthropic) | 150円 | 750円 | 少量あり |
| Gemini 2.5 Flash (Google) | 45円 | 375円 | あり |
| Gemini 2.5 Pro (Google) | 188円 | 1,500円 | あり（制限大） |

### AIコーディングIDE（参考）

APIではなくサブスクリプション型の比較。

| ツール | 無料プラン | 有料プラン | 備考 |
|--------|-----------|-----------|------|
| [Cursor](https://cursor.com/pricing) | Hobby（制限あり） | $20/月〜 | Tab補完・エージェント |
| [Kiro](https://kiro.dev/pricing) | 50クレジット/月 | $20/月〜 | Amazon製、GA済み |

---

## 前提条件

- **Node.js 18 以上**
  ```bash
  # Mac (Homebrew)
  brew install node

  # Ubuntu
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```

- **APIキーの取得**
  [さくらAI Engine](https://ai.sakura.ad.jp/) でアカウントを作成し、APIキーを発行する。

---

## リポジトリをクローン

```bash
git clone https://github.com/sora0513/sakura-ai.git
cd sakura-ai
```

---

## MCP Server

Claude Code / Cursor から Sakura AI のモデルをツールとして呼び出せるサーバー。

### インストール

```bash
cd mcp-server
npm install
cd ..
```

### Claude Code への登録

`~/.claude.json` を開き、`mcpServers` に以下を追加する。

> `~/.claude.json` が存在しない場合は新規作成する。  
> 既に他のMCPサーバーが登録されている場合は `mcpServers` の中に追記する。

```json
{
  "mcpServers": {
    "sakura-ai": {
      "type": "stdio",
      "command": "node",
      "args": ["/絶対パス/sakura-ai/mcp-server/index.js"],
      "env": {
        "SAKURA_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

`/絶対パス/sakura-ai/` の部分は実際のパスに変更する。確認方法：

```bash
# クローンしたディレクトリで実行
pwd
# 出力例: /Users/yourname/sakura-ai
# → args は ["/Users/yourname/sakura-ai/mcp-server/index.js"] になる
```

設定後、Claude Code を再起動する。

### Cursor への登録

Cursor の設定 → `MCP` → `Add new MCP server` から以下を入力：

- **Name**: `sakura-ai`
- **Type**: `stdio`
- **Command**: `node /絶対パス/sakura-ai/mcp-server/index.js`
- **Environment**: `SAKURA_API_KEY=your_api_key_here`

### 利用できるツール

| ツール | 用途 |
|--------|------|
| `sakura_chat` | 汎用チャット（モデル選択可） |
| `sakura_code_review` | コードレビュー（diff + spec を渡す） |
| `sakura_generate_spec` | Issue から実装仕様書を生成 |
| `sakura_generate_code` | 仕様書からコード生成 |
| `sakura_sales_email` | アウトリーチメール生成 |

モデルエイリアス：

| エイリアス | モデル |
|-----------|--------|
| `kimi` | preview/Kimi-K2.6 |
| `coder` | Qwen3-Coder-480B-A35B-Instruct-FP8 |
| `coder-light` | Qwen3-Coder-30B-A3B-Instruct |
| `gpt-oss` | gpt-oss-120b |
| `llm-jp` | llm-jp-3.1-8x13b-instruct4 |

---

## OpenCode 設定

[opencode](https://opencode.ai/) で Sakura AI をプロバイダーとして使う設定。

### opencode のインストール

```bash
# mise で管理（推奨）
mise install opencode@latest
```

mise 自体のインストールは [mise 公式](https://mise.jdx.dev/) を参照。

### 設定ファイルを配置

```bash
mkdir -p ~/.config/opencode
cp opencode/opencode.json ~/.config/opencode/opencode.json
```

`~/.config/opencode/opencode.json` を開き、`YOUR_API_KEY_HERE` を実際のAPIキーに書き換える：

```json
"options": {
  "baseURL": "https://api.ai.sakura.ad.jp/v1",
  "apiKey": "ここに実際のAPIキーを入れる"
}
```

---

## Zed 設定

[Zed](https://zed.dev/) の Agent パネルで Sakura AI を使う。

### settings.json を編集

`~/.config/zed/settings.json` を開き、`zed/settings-snippet.json` の内容をマージする。

既に `language_models` キーがある場合は `openai_compatible` セクションだけ追記する。

```json
{
  "agent": {
    "default_model": {
      "provider": "Sakura AI",
      "model": "preview/Kimi-K2.6",
      "enable_thinking": false
    },
    "dock": "right"
  },
  "language_models": {
    "openai_compatible": {
      "Sakura AI": {
        "api_url": "https://api.ai.sakura.ad.jp/v1",
        "available_models": [
          { "name": "preview/Kimi-K2.6", "display_name": "Kimi-K2.6 (Sakura)", "max_tokens": 131072 },
          { "name": "Qwen3-Coder-480B-A35B-Instruct-FP8", "display_name": "Qwen3-Coder-480B (Sakura)", "max_tokens": 131072 },
          { "name": "gpt-oss-120b", "display_name": "gpt-oss-120b (Sakura)", "max_tokens": 131072 }
        ]
      }
    }
  }
}
```

### APIキーを登録

Zed は `settings.json` に APIキーを書いても読まない。UI から入力する必要がある。

1. Zed を再起動
2. Agent パネル（右側）を開く
3. モデル選択ドロップダウンから `Kimi-K2.6 (Sakura)` を選択
4. APIキーの入力を求められたら入力する

---

## 問題が起きたら

動かない・設定がうまくいかない場合は [Issue](../../issues) で報告してください。
