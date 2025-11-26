
// ビルド時に埋め込まれる設定値 ---
const GAS_ID = "m2";
const GAS_URL = "AKfycbzqRe3EMTvQRTqPuOCC8TABFjxG4fyDP2VWiKFpoZDEXgBWH7j0xVVOZ9c0zGwxKaWNQw";

// フォーム項目リスト(JSON文字列として埋め込まれ、JSでパースされる)
const FORM_FIELDS = JSON.parse('["マリン池袋北口駅前店"]');
const ENDPOINT = `https://script.google.com/macros/s/${GAS_URL}/exec`;

const CONFIG = {
    // GASから取得した値を格納する変数
    GROUP_NAME_FROM_SHEET: "",
    AUTH_PASSWORD: ""
};

// メンバーリスト等を保持するデータオブジェクト
const MASTER_DATA = {
    members: []
};




let requestCount = 0;



// アプリケーション初期化関数
async function initApp() {
    // 1. パスワード入力プロンプト
    const password = prompt("認証パスワードを入力してください:");

    if (!password) {
        alert("パスワードが入力されませんでした。リロードして再試行してください。");
        return;
    }

    try {
        // 2. 認証リクエスト (GET)
        // groupId と password をクエリパラメータとして送信
        const url = `${ENDPOINT}?password=${encodeURIComponent(password)}&groupId=${GAS_ID}`;

        // 読み込み中であることを示す(簡易的)
        document.body.style.cursor = "wait";

        const response = await fetch(url);
        const data = await response.json();

        document.body.style.cursor = "default";

        if (data.auth === true) {
            // 3. 認証成功: データを保存
            console.log("認証成功:", data);

            // GASのF2セルの値
            CONFIG.GROUP_NAME_FROM_SHEET = data.groupName;
            // メンバーリストの更新
            MASTER_DATA.members = data.members || [];
            CONFIG.AUTH_PASSWORD = password;

            // 4. 初期画面の描画を開始
            setupEventHandlers();
            createRequestSet(); // 初期セット追加

        } else {
            // 認証失敗
            alert("パスワードが違います。");
            location.reload();
        }
    } catch (error) {
        console.error(error);
        alert("サーバー通信エラーが発生しました。");
        document.body.style.cursor = "default";
    }
}

function createRequestSet() {
    requestCount++;

    // メンバーリストのoptionタグを生成 MASTER_DATA.members の配列から option を作成
    const memberOptions = MASTER_DATA.members.map(member => {
        return `<option value="${member}">${member}</option>`;
    }).join('');

    // FORM_FIELDSから店舗の選択肢を生成
    const placeOptions = FORM_FIELDS.map(place => {
        return `<option value="${place}">${place}</option>`;
    }).join('');

    const div = document.createElement("div");
    div.className = "request-set";

    // HTML生成
    div.innerHTML = `
        <h3 class="title2">【業務依頼】${CONFIG.GROUP_NAME_FROM_SHEET}</h3>

        <label class="main-label">店舗選択</label>
        <select name="place_${requestCount}" id="placeSelect_${requestCount}" required>
            <option value="">選択</option>
            ${placeOptions}
        </select>

        <label class="main-label">メンバー選択</label>
        <select name="member_${requestCount}" required>
            <option value="">選択</option>
            ${memberOptions}
            <option value="未登録">未登録</option>
        </select>
        <input type="text" name="member_custom_${requestCount}" placeholder="未登録者の場合はこちらに入力">

        <label class="main-label">業務区分</label>
        <select name="business_${requestCount}" class="business-select" data-index="${requestCount}" required>
            <option value="">選択</option>
            <option value="バナー">バナー</option>
            <option value="LP">LP</option>
            <option value="料金表">料金表</option>
            <option value="WEB">WEB</option>
            <option value="グラビア">グラビア</option>
            <option value="動画">動画</option>
            <option value="画像全般">画像全般</option>
            <option value="POPポスター">POPポスター</option>
            <option value="名刺">名刺</option>
            <option value="シール">シール</option>
            <option value="のぼり">のぼり</option>
            <option value="看板">看板</option>
            <option value="避難経路図">避難経路図</option>
            <option value="組織図">組織図</option>
            <option value="その他">その他</option>
        </select>

        <label class="main-label">作業区分</label>
        <div class="checkbox-group">
            <label class="checkbox-label">
                <input type="checkbox" name="category_${requestCount}" value="新規作成">
                <span>新規作成</span>
            </label>
            <label class="checkbox-label">
                <input type="checkbox" name="category_${requestCount}" value="修正">
                <span>修正</span>
            </label>
            <label class="checkbox-label">
                <input type="checkbox" name="category_${requestCount}" value="文言変更">
                <span>文言変更</span>
            </label>
            <label class="checkbox-label">
                <input type="checkbox" name="category_${requestCount}" value="画像差し替え">
                <span>画像差し替え</span>
            </label>
            <label class="checkbox-label">
                <input type="checkbox" name="category_${requestCount}" value="サイズ変更">
                <span>サイズ変更</span>
            </label>
            <label class="checkbox-label">
                <input type="checkbox" name="category_${requestCount}" value="サイズ追加">
                <span>サイズ追加</span>
            </label>
            <label class="checkbox-label">
                <input type="checkbox" name="category_${requestCount}" value="キャスト追加">
                <span>キャスト追加</span>
            </label>
            <label class="checkbox-label">
                <input type="checkbox" name="category_${requestCount}" value="メンバー追加">
                <span>メンバー追加</span>
            </label>
            <label class="checkbox-label">
                <input type="checkbox" name="category_${requestCount}" value="その他">
                <span>その他</span>
            </label>
        </div>

        <div class="main-block hidden" id="banner-size-block_${requestCount}">
            <label class="main-label">バナー サイズ一覧</label>
            <div class="checkbox-group">
                <label class="checkbox-label">
                    <input type="checkbox" name="size_banner_${requestCount}" value="1920x1080">
                    <span>1920x1080</span>
                </label>
                <label class="checkbox-label">
                    <input type="checkbox" name="size_banner_${requestCount}" value="640x640">
                    <span>640x640</span>
                </label>
                <label class="checkbox-label">
                    <input type="checkbox" name="size_banner_${requestCount}" value="700x300">
                    <span>700x300</span>
                </label>
                <label class="checkbox-label">
                    <input type="checkbox" name="size_banner_${requestCount}" value="1500x500">
                    <span>1500x500</span>
                </label>
            </div>
        </div>

        <div class="main-block hidden" id="print-size-block_${requestCount}">
            <label class="main-label">印刷関連 サイズ一覧</label>
            <div class="grid-table">
                <div class="grid-header">
                    <div class="grid-cell"></div>
                    <div class="grid-cell">A1</div>
                    <div class="grid-cell">A2</div>
                    <div class="grid-cell">A3</div>
                    <div class="grid-cell">A4</div>
                </div>
                <div class="grid-row">
                    <div class="grid-cell grid-label">普通紙 - ラミネート加工</div>
                    <div class="grid-cell"><label class="grid-checkbox"><input type="checkbox" name="print_normal_${requestCount}" value="A1"></label></div>
                    <div class="grid-cell"><label class="grid-checkbox"><input type="checkbox" name="print_normal_${requestCount}" value="A2"></label></div>
                    <div class="grid-cell"><label class="grid-checkbox"><input type="checkbox" name="print_normal_${requestCount}" value="A3"></label></div>
                    <div class="grid-cell"><label class="grid-checkbox"><input type="checkbox" name="print_normal_${requestCount}" value="A4"></label></div>
                </div>
                <div class="grid-row">
                    <div class="grid-cell grid-label">写真紙 - ラミネート加工</div>
                    <div class="grid-cell"><label class="grid-checkbox"><input type="checkbox" name="print_photo_${requestCount}" value="A1"></label></div>
                    <div class="grid-cell"><label class="grid-checkbox"><input type="checkbox" name="print_photo_${requestCount}" value="A2"></label></div>
                    <div class="grid-cell"><label class="grid-checkbox"><input type="checkbox" name="print_photo_${requestCount}" value="A3"></label></div>
                    <div class="grid-cell"><label class="grid-checkbox"><input type="checkbox" name="print_photo_${requestCount}" value="A4"></label></div>
                </div>
                <div class="grid-row">
                    <div class="grid-cell grid-label">内照紙 - ラミネート加工</div>
                    <div class="grid-cell"><label class="grid-checkbox"><input type="checkbox" name="print_back_${requestCount}" value="A1"></label></div>
                    <div class="grid-cell"><label class="grid-checkbox"><input type="checkbox" name="print_back_${requestCount}" value="A2"></label></div>
                    <div class="grid-cell"><label class="grid-checkbox"><input type="checkbox" name="print_back_${requestCount}" value="A3"></label></div>
                    <div class="grid-cell"><label class="grid-checkbox"><input type="checkbox" name="print_back_${requestCount}" value="A4"></label></div>
                </div>
            </div>
        </div>

        <label class="main-label">内訳</label>
        <textarea name="details_${requestCount}" placeholder="内訳を入力" required></textarea>

        <label class="main-label">備考</label>
        <textarea name="note_${requestCount}"></textarea>
    `;

    document.getElementById("requestContainer").appendChild(div);

    // 業務区分の変更イベントを設定
    const businessSelect = div.querySelector('.business-select');
    businessSelect.addEventListener('change', function() {
        const index = this.dataset.index;
        const bannerBlock = document.getElementById(`banner-size-block_${index}`);
        const printBlock = document.getElementById(`print-size-block_${index}`);

        if (this.value === 'バナー') {
            bannerBlock.classList.remove('hidden');
            printBlock.classList.add('hidden');
        } else if (this.value === 'POPポスター' || this.value === 'のぼり' || this.value === '看板') {
            bannerBlock.classList.add('hidden');
            printBlock.classList.remove('hidden');
        } else {
            bannerBlock.classList.add('hidden');
            printBlock.classList.add('hidden');
        }
    });
}

// イベントハンドラの設定を関数化(初期化後に呼ぶため)
function setupEventHandlers() {
    document.getElementById("addRequest").addEventListener("click", createRequestSet);

    document.getElementById("mainForm").addEventListener("submit", async function(e) {
        e.preventDefault();

        const submitBtn = document.getElementById("submitBtn");
        const resultDiv = document.getElementById("result");

        // ボタンを無効化
        submitBtn.disabled = true;
        submitBtn.textContent = '送信中...';
        resultDiv.style.display = 'none';

        const formData = new FormData(this);
        const requests = [];

        for (let i = 1; i <= requestCount; i++) {
            // チェックボックスの値収集用ヘルパー
            const getCheckedValues = (name) => {
                const checked = document.querySelectorAll(`input[name="${name}"]:checked`);
                return Array.from(checked).map(cb => cb.value).join(', ');
            };

            requests.push({
                // グループ名はフォーム入力ではなく、GASから取得したCONFIGの値を使用
                order_date: formData.get(`order_date_${i}`),
                order_time: formData.get(`order_time_${i}`),
                member: formData.get(`member_${i}`),
                member_custom: formData.get(`member_custom_${i}`),
                group: CONFIG.GROUP_NAME_FROM_SHEET,
                place: formData.get(`place_${i}`),
                business: formData.get(`business_${i}`),
                // checkbox系はformData.getだと1つしか取れない場合があるため、必要に応じてロジック調整推奨
                // ここでは簡易的にformData.getまたはカスタム収集
                category: getCheckedValues(`category_${i}`),
                details: formData.get(`details_${i}`),
                note: formData.get(`note_${i}`),

                // 追加: サイズ情報の収集(例)
                size_banner: getCheckedValues(`size_banner_${i}`),
                print_normal: getCheckedValues(`print_normal_${i}`),
                print_photo: getCheckedValues(`print_photo_${i}`),
                print_back: getCheckedValues(`print_back_${i}`),
            });
        }

        try {
            // GASへ送信
            const response = await fetch(ENDPOINT, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8'
                },
                // パスワードも送信データに含める場合はここで追加可能 requests配列を送る構成
                body: JSON.stringify({
                    requests: requests,
                    auth_password: CONFIG.AUTH_PASSWORD // 必要であれば認証用パスワードも再送
                })
            });

            if (response.ok) {
                const result = await response.json();

                if (result.status === 'success' || result.result === 'success' || result.auth === true) {
                    resultDiv.textContent = "送信が完了しました!";
                    resultDiv.className = 'success';
                    resultDiv.style.display = 'block';

                    // フォームをリセット
                    this.reset();
                    document.getElementById("requestContainer").innerHTML = "";
                    requestCount = 0;
                    createRequestSet();
                } else {
                    throw new Error('GAS側でエラーが発生しました');
                }
            } else {
                throw new Error('サーバーエラー');
            }
        } catch (error) {
            console.error('Error:', error);
            resultDiv.textContent = "送信に失敗しました。もう一度お試しください。";
            resultDiv.className = 'error';
            resultDiv.style.display = 'block';
        } finally {
            // ボタンを元に戻す
            submitBtn.disabled = false;
            submitBtn.textContent = '送信';
        }
    });
}

// DOM読み込み完了後に認証フロー(initApp)を開始
document.addEventListener('DOMContentLoaded', initApp);