
// ビルド時に埋め込まれる設定値 ---
const GAS_ID = "m2";
const GAS_URL = "AKfycbzFgPZuSpnZKIm86ZQNsgxygyd4UCwlIzGvxieLl-DP_wEGkhzcR8VjCSYxnt9fBY4dEA";

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

    // ローディング表示を追加
    const requestContainer = document.getElementById("requestContainer");
    requestContainer.innerHTML = '<div class="loading-message">NOW LOADING...</div>';


    // パスワード入力プロンプト
    const password = prompt("認証パスワードを入力してください:");

    if (!password) {
        alert("パスワードが入力されませんでした。リロードして再試行してください。");
        requestContainer.innerHTML = '';
        return;
    }

    try {
        // 認証リクエスト (GET)
        // groupId と password をクエリパラメータとして送信
        const url = `${ENDPOINT}?password=${encodeURIComponent(password)}&groupId=${GAS_ID}`;

        // 読み込み中であることを示す(簡易的)
        document.body.style.cursor = "wait";

        const response = await fetch(url);
        const data = await response.json();

        document.body.style.cursor = "default";

        if (data.auth === true) {
            // 認証成功: データを保存
            console.log("認証成功:", data);

            // GASのF2セルの値
            CONFIG.GROUP_NAME_FROM_SHEET = data.groupName;

            // メンバーリストの更新
            MASTER_DATA.members = data.members || [];
            CONFIG.AUTH_PASSWORD = password;

            // ローディングメッセージをクリア
            requestContainer.innerHTML = '';

            // 初期画面の描画を開始
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
        requestContainer.innerHTML = '';
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

    // 店舗が1つだけの場合の処理
    const placeSelectHTML = FORM_FIELDS.length === 1
        ? `<input type="text" name="place_${requestCount}" value="${FORM_FIELDS[0]}" readonly class="readonly-input">`
        : `<select name="place_${requestCount}" id="placeSelect_${requestCount}" required>
            <option value="">選択</option>
            ${placeOptions}
        </select>`;

    const div = document.createElement("div");
    div.className = "request-set";

    // HTML生成
    div.innerHTML = `
        <h3 class="title2">フォームを入力してください</h3>

        <label class="main-label mark">店舗選択</label>
        <div class="select-wrapper">
            ${placeSelectHTML}
        </div>

        <div class="form-group required">
            <label class="main-label mark">依頼メンバー選択</label>
            <div class="select-wrapper">
                <select name="member_${requestCount}" required>
                    <option value="">選択</option>
                    ${memberOptions}
                    <option value="未登録者">未登録者</option>
                </select>
            </div>
            <input type="text" name="member_custom_${requestCount}" placeholder="未登録者の場合はこちらに入力">
        </div>

        <div class="form-group required">
            <label class="main-label mark">業務区分</label>
            <div class="select-wrapper">
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
            </div>
        </div>

        <label class="main-label">作業区分</label>
            <div class="checkbox-group">
                <div class="category-label-wrapper">
                    <div class="accordion-item" id="item-1">
                        <div class="accordion-header">
                        <span class="item-title">項目A</span>
                        
                        <label class="checkbox-label">
                            <input type="checkbox" class="enable-check"> 
                            <span>有効</span>
                        </label>

                        <div class="input-group">
                            <span class="label-text">パターン数</span>
                            <input type="number" class="num-input pattern-count-input" min="1" max="30" placeholder="0">
                            <button type="button" class="set-btn">SET</button>
                        </div>
                        </div>

                        <div class="accordion-content">
                        <div class="rows-container"></div>
                        
                        <div class="details-area">
                            <label class="main-label">内訳</label>
                            <textarea class="sync-target" placeholder="自動入力されます"></textarea>
                        </div>
                        </div>
                    </div>

                    <div class="accordion-item" id="item-2">
                        <div class="accordion-header">
                        <span class="item-title">項目B</span>
                        <label class="checkbox-label"><input type="checkbox" class="enable-check"> <span>有効</span></label>
                        <div class="input-group">
                            <span class="label-text">パターン数</span>
                            <input type="number" class="num-input pattern-count-input" min="1" max="30" placeholder="0">
                            <button type="button" class="set-btn">SET</button>
                        </div>
                        </div>
                        <div class="accordion-content">
                        <div class="rows-container"></div>
                        <div class="details-area">
                            <label class="main-label">内訳</label>
                            <textarea class="sync-target" placeholder="自動入力されます"></textarea>
                        </div>
                        </div>
                    </div>

                    <div class="accordion-item" id="item-3">
                        <div class="accordion-header">
                        <span class="item-title">項目C</span>
                        <label class="checkbox-label"><input type="checkbox" class="enable-check"> <span>有効</span></label>
                        <div class="input-group">
                            <span class="label-text">パターン数</span>
                            <input type="number" class="num-input pattern-count-input" min="1" max="30" placeholder="0">
                            <button type="button" class="set-btn">SET</button>
                        </div>
                        </div>
                        <div class="accordion-content">
                        <div class="rows-container"></div>
                        <div class="details-area">
                            <label class="main-label">内訳</label>
                            <textarea class="sync-target" placeholder="自動入力されます"></textarea>
                        </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>



        <div class="size-buttons">
            <button type="button" class="size-toggle-btn" data-target="banner-size-block_${requestCount}">バナーサイズ一覧</button>
            <button type="button" class="size-toggle-btn" data-target="print-size-block_${requestCount}">印刷サイズ一覧</button>
        </div>

        <div class="main-block hidden" id="banner-size-block_${requestCount}">
            <label class="main-label">バナー サイズ一覧</label>
            <div class="checkbox-group">
                <label class="checkbox-label">
                    <input type="checkbox" name="size_banner_${requestCount}" value="1920x1080" class="size-checkbox" data-textarea="details_${requestCount}">
                    <span>1920x1080</span>
                </label>
                <label class="checkbox-label">
                    <input type="checkbox" name="size_banner_${requestCount}" value="640x640" class="size-checkbox" data-textarea="details_${requestCount}">
                    <span>640x640</span>
                </label>
                <label class="checkbox-label">
                    <input type="checkbox" name="size_banner_${requestCount}" value="700x300" class="size-checkbox" data-textarea="details_${requestCount}">
                    <span>700x300</span>
                </label>
                <label class="checkbox-label">
                    <input type="checkbox" name="size_banner_${requestCount}" value="1500x500" class="size-checkbox" data-textarea="details_${requestCount}">
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
                    <div class="grid-cell"><label class="grid-checkbox"><input type="checkbox" class="print-size-checkbox" data-type="普通紙 - ラミネート加工" data-size="A1" data-textarea="details_${requestCount}"></label></div>
                    <div class="grid-cell"><label class="grid-checkbox"><input type="checkbox" class="print-size-checkbox" data-type="普通紙 - ラミネート加工" data-size="A2" data-textarea="details_${requestCount}"></label></div>
                    <div class="grid-cell"><label class="grid-checkbox"><input type="checkbox" class="print-size-checkbox" data-type="普通紙 - ラミネート加工" data-size="A3" data-textarea="details_${requestCount}"></label></div>
                    <div class="grid-cell"><label class="grid-checkbox"><input type="checkbox" class="print-size-checkbox" data-type="普通紙 - ラミネート加工" data-size="A4" data-textarea="details_${requestCount}"></label></div>
                </div>
                <div class="grid-row">
                    <div class="grid-cell grid-label">写真紙 - ラミネート加工</div>
                    <div class="grid-cell"><label class="grid-checkbox"><input type="checkbox" class="print-size-checkbox" data-type="写真紙 - ラミネート加工" data-size="A1" data-textarea="details_${requestCount}"></label></div>
                    <div class="grid-cell"><label class="grid-checkbox"><input type="checkbox" class="print-size-checkbox" data-type="写真紙 - ラミネート加工" data-size="A2" data-textarea="details_${requestCount}"></label></div>
                    <div class="grid-cell"><label class="grid-checkbox"><input type="checkbox" class="print-size-checkbox" data-type="写真紙 - ラミネート加工" data-size="A3" data-textarea="details_${requestCount}"></label></div>
                    <div class="grid-cell"><label class="grid-checkbox"><input type="checkbox" class="print-size-checkbox" data-type="写真紙 - ラミネート加工" data-size="A4" data-textarea="details_${requestCount}"></label></div>
                </div>
                <div class="grid-row">
                    <div class="grid-cell grid-label">内照紙 - ラミネート加工</div>
                    <div class="grid-cell"><label class="grid-checkbox"><input type="checkbox" class="print-size-checkbox" data-type="内照紙 - ラミネート加工" data-size="A1" data-textarea="details_${requestCount}"></label></div>
                    <div class="grid-cell"><label class="grid-checkbox"><input type="checkbox" class="print-size-checkbox" data-type="内照紙 - ラミネート加工" data-size="A2" data-textarea="details_${requestCount}"></label></div>
                    <div class="grid-cell"><label class="grid-checkbox"><input type="checkbox" class="print-size-checkbox" data-type="内照紙 - ラミネート加工" data-size="A3" data-textarea="details_${requestCount}"></label></div>
                    <div class="grid-cell"><label class="grid-checkbox"><input type="checkbox" class="print-size-checkbox" data-type="内照紙 - ラミネート加工" data-size="A4" data-textarea="details_${requestCount}"></label></div>
                </div>
            </div>
        </div>

        <label class="main-label">備考</label>
        <textarea name="note_${requestCount}"></textarea>
    `;

    document.getElementById("requestContainer").appendChild(div);


    document.addEventListener('DOMContentLoaded', () => {

    // 全てのアコーディオンアイテムに対して処理を適用
    const items = document.querySelectorAll('.accordion-item');

    items.forEach(item => {
        const setBtn = item.querySelector('.set-btn');
        const patternCountInput = item.querySelector('.pattern-count-input');
        const contentArea = item.querySelector('.accordion-content');
        const rowsContainer = item.querySelector('.rows-container');
        const syncTextarea = item.querySelector('.sync-target');

        // SETボタンクリック時の処理
        setBtn.addEventListener('click', () => {
        let count = parseInt(patternCountInput.value, 10);

        // バリデーション：1〜30の間
        if (isNaN(count) || count <= 0) return;
        if (count > 30) {
            alert('最大30までしか入力できません');
            patternCountInput.value = 30;
            count = 30;
        }

        // 既存の行をクリアして再生成
        rowsContainer.innerHTML = '';

        for (let i = 1; i <= count; i++) {
            // 行を作成
            const rowDiv = document.createElement('div');
            rowDiv.className = 'generated-row';

            // パターン名入力 (編集可能なテキスト)
            const patternInput = document.createElement('input');
            patternInput.type = 'text';
            patternInput.className = 'pattern-text-input';
            patternInput.placeholder = `パターン${i}`;
            // 初期値としてプレースホルダーと同じ値を入れておくか、
            // 空の場合は同期時にプレースホルダーを使うロジックにする
            // ここでは空にしておき、同期時に値がなければプレースホルダーを使う処理にします

            // 「サイズ数」ラベル
            const sizeLabel = document.createElement('span');
            sizeLabel.textContent = 'サイズ数';
            sizeLabel.className = 'label-text';

            // サイズ数入力 (数字2桁)
            const sizeInput = document.createElement('input');
            sizeInput.type = 'number';
            sizeInput.className = 'num-input size-count-input';
            sizeInput.min = '0';
            sizeInput.max = '30';
            sizeInput.placeholder = '0';

            // イベントリスナー追加（入力時に同期処理を走らせる）
            patternInput.addEventListener('input', updateDetails);
            sizeInput.addEventListener('input', updateDetails);

            // 要素を追加
            rowDiv.appendChild(patternInput);
            rowDiv.appendChild(sizeLabel);
            rowDiv.appendChild(sizeInput);

            rowsContainer.appendChild(rowDiv);
        }

        // エリアを表示する
        contentArea.classList.add('active');

        // 初回の同期実行
        updateDetails();
        });

        // 入力制限（数字2桁、最大30）の汎用処理
        // 動的に追加された要素にも効くように親要素でイベント委譲、または作成時に付与
        // ここでは作成時にmax属性をつけているが、入力時の制御も追加
        item.addEventListener('input', (e) => {
        if (e.target.classList.contains('num-input')) {
            let val = parseInt(e.target.value, 10);
            if (val > 30) e.target.value = 30;
            // 文字数制限（2桁）
            if (e.target.value.length > 2) e.target.value = e.target.value.slice(0, 2);
        }
        });

        // 同期処理関数
        function updateDetails() {
        const rows = rowsContainer.querySelectorAll('.generated-row');
        let resultString = '';

        rows.forEach((row, index) => {
            const pInput = row.querySelector('.pattern-text-input');
            const sInput = row.querySelector('.size-count-input');

            // パターン名：入力があればそれ、なければplaceholderの値を使う
            const pName = pInput.value.trim() !== '' ? pInput.value : pInput.placeholder;

            // サイズ数：入力があればそれ、なければ空（または0）
            const sCount = sInput.value;

            // サイズ数が入力されている場合のみ文字列に追加、あるいは常に表示するか
            // 要件：パターン1+「：」+「サイズ数数値」サイズ+
            if (sCount) {
            resultString += `${pName}：${sCount}サイズ、`;
            }
        });

        // 末尾の「、」を削除したければ下記を有効化
        // if (resultString.endsWith('、')) {
        //   resultString = resultString.slice(0, -1);
        // }

        syncTextarea.value = resultString;
        }
    });

    });


    // 業務区分の変更イベントを設定(削除: バナー/印刷サイズの自動表示は廃止)

    // 1. 作業区分のチェックボックスイベント設定
    const categoryCheckboxes = div.querySelectorAll('.category-checkbox');
    categoryCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const index = this.dataset.index;
            const newCreateInline = document.getElementById(`new-create-inline_${index}`);
            const modifyBlock = document.getElementById(`modify-block_${index}`);

            const isNewCreateChecked = div.querySelector(`input[name="category_${index}"][value="新規作成"]`).checked;
            const isModifyChecked = div.querySelector(`input[name="category_${index}"][value="修正"]`).checked;

            if (isNewCreateChecked) {
                newCreateInline.classList.remove('hidden');
            } else {
                newCreateInline.classList.add('hidden');
            }

            if (isModifyChecked) {
                modifyBlock.classList.remove('hidden');
            } else {
                modifyBlock.classList.add('hidden');
            }
        });
    });

    // 2. サイズボタンのトグル処理
    const sizeButtons = div.querySelectorAll('.size-toggle-btn');
    sizeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.dataset.target;
            const targetBlock = document.getElementById(targetId);
            targetBlock.classList.toggle('hidden');

            // ボタンのテキストを変更
            if (targetBlock.classList.contains('hidden')) {
                this.textContent = this.textContent.replace('閉じる', '一覧');
            } else {
                this.textContent = this.textContent.replace('一覧', '閉じる');
            }
        });
    });

    // 2. バナーサイズチェックボックスのイベント
    const sizeCheckboxes = div.querySelectorAll('.size-checkbox');
    sizeCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const textareaName = this.dataset.textarea;
            const textarea = document.querySelector(`textarea[name="${textareaName}"]`);
            const value = this.value;

            if (this.checked) {
                // チェックされたら追加
                const currentValue = textarea.value;
                if (currentValue) {
                    textarea.value = currentValue + value + ',';
                } else {
                    textarea.value = value + ',';
                }
            } else {
                // チェック外されたら削除
                textarea.value = textarea.value.replace(value + ',', '');
            }
        });
    });

    // 2. 印刷サイズチェックボックスのイベント
    const printCheckboxes = div.querySelectorAll('.print-size-checkbox');
    printCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const textareaName = this.dataset.textarea;
            const textarea = document.querySelector(`textarea[name="${textareaName}"]`);
            const type = this.dataset.type;
            const size = this.dataset.size;

            // 同じタイプの全チェックボックスを取得
            const sameTypeCheckboxes = div.querySelectorAll(`.print-size-checkbox[data-type="${type}"][data-textarea="${textareaName}"]`);
            const checkedSizes = Array.from(sameTypeCheckboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.dataset.size);

            // 現在のtextarea値を解析して、このタイプのエントリを更新
            let lines = textarea.value.split(',').filter(l => l.trim());

            // このタイプの既存エントリを削除
            lines = lines.filter(line => !line.includes(type));

            // チェックされたサイズがあれば新しいエントリを追加
            if (checkedSizes.length > 0) {
                lines.push(`${type}${checkedSizes.join(',')}`);
            }

            textarea.value = lines.join(',') + (lines.length > 0 ? ',' : '');
        });
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

            // 作業区分の処理
            const categoryValues = getCheckedValues(`category_${i}`);
            let categoryOutput = categoryValues;

            // 新規作成が選ばれている場合
            if (categoryValues.includes('新規作成')) {
                const patternCount = formData.get(`pattern_count_${i}`) || '';
                const sizeCount = formData.get(`size_count_${i}`) || '';

                if (patternCount || sizeCount) {
                    const business = formData.get(`business_${i}`);
                    categoryOutput = `${business}`;
                    if (patternCount) categoryOutput += `/${patternCount}種`;
                    if (sizeCount) categoryOutput += `/${sizeCount}サイズ`;
                }
            }

            // 修正が選ばれている場合
            if (categoryValues.includes('修正')) {
                const modifyTypes = getCheckedValues(`modify_type_${i}`);
                if (modifyTypes) {
                    categoryOutput += ` (${modifyTypes})`;
                }
            }

            requests.push({
                member: formData.get(`member_${i}`),
                member_custom: formData.get(`member_custom_${i}`),
                group: CONFIG.GROUP_NAME_FROM_SHEET,
                place: formData.get(`place_${i}`),
                business: formData.get(`business_${i}`),
                category: categoryOutput,
                details: formData.get(`details_${i}`),
                note: formData.get(`note_${i}`)
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
                body: JSON.stringify({
                    requests: requests,
                    auth_password: CONFIG.AUTH_PASSWORD
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