
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

    // 要素が存在しない場合のエラーハンドリング
    if (!requestContainer) {
        console.error("requestContainer要素が見つかりません。HTMLに id='requestContainer' の要素があるか確認してください。");
        alert("ページの初期化に失敗しました。ページを再読み込みしてください。");
        return;
    }

    // パスワード入力プロンプト
    const password = prompt("認証パスワードを入力してください:");

    if (!password) {
        alert("パスワードが入力されませんでした。リロードして再試行してください。");
        requestContainer.innerHTML = '';
        return;
    }

    // 認証を待たずに、フォームを先行描画 ※メンバーリストは空の状態で描画されます
    requestContainer.innerHTML = '';
    setupEventHandlers();
    createRequestSet();

    try {
        // 認証リクエスト (GET)※裏側でGASへ問い合わせる
        // groupId と password をクエリパラメータとして送信
        const url = `${ENDPOINT}?groupId=${encodeURIComponent(GAS_ID)}&password=${encodeURIComponent(password)}`;

        // 読み込み中であることを示す(簡易的)
        document.body.style.cursor = "wait";

        const response = await fetch(url);

        // レスポンスのステータスチェック
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

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

            // 遅延反映：取得したメンバーリストを、既に表示されているフォームに適用する
            updateMemberDropdowns();

        } else {
            // 認証失敗
            // すでにフォームが見えてしまっているので、隠してリロード
            document.querySelector("main").style.display = "none";
            alert("パスワードが違います。");
            location.reload();
        }
    } catch (error) {
        console.error("通信エラー詳細:", error);
        alert(`サーバー通信エラーが発生しました。\n詳細: ${error.message}`);
        document.body.style.cursor = "default";
        requestContainer.innerHTML = '';
    }
}

function updateMemberDropdowns() {

    const selects = document.querySelectorAll('.member-select');

    selects.forEach(select => {

        // 現在の選択値を保持（もしユーザーが通信中に選んでいた場合のため）
        const currentValue = select.value;

        // 選択肢をクリア
        select.innerHTML = '';

        // デフォルトの空選択肢などを追加
        const defaultOption = document.createElement('option');
        defaultOption.text = "選択";
        defaultOption.value = "";
        select.appendChild(defaultOption);

        // 取得したメンバーを追加
        if (MASTER_DATA.members && MASTER_DATA.members.length > 0) {
            MASTER_DATA.members.forEach(member => {
                const option = document.createElement('option');
                option.text = member; // 名前
                option.value = member; // 値
                select.appendChild(option);
            });
        }

        // 固定の末尾オプション「未登録者」を追加
        const unknownOption = document.createElement('option');
        unknownOption.text = "未登録者";
        unknownOption.value = "未登録者";
        select.appendChild(unknownOption);

        // 値を復元（もしあれば）
        if(currentValue) {
            select.value = currentValue;
        }
    });
}

function createRequestSet() {
    requestCount++;

    let memberOptions = "";

    if (MASTER_DATA.members.length === 0) {
        // 通信待ちの状態（まだデータがない）
        memberOptions = `<option value="" disabled>データ読み込み中...</option>`;
    } else {
        // データがある状態（2行目の追加ボタンを押した時や、通信完了後）
        memberOptions = MASTER_DATA.members.map(member => {
            return `<option value="${member}">${member}</option>`;
        }).join('');
    }

    // FORM_FIELDSから店舗の選択肢を生成
    const placeOptions = FORM_FIELDS.map(place => {
        return `<option value="${place}">${place}</option>`;
    }).join('');

    // 前回の店舗選択値を取得
    let previousPlace = '';
    if (requestCount > 1) {
        const prevPlaceInput = document.querySelector(`input[name="place_${requestCount - 1}"]`);
        const prevPlaceSelect = document.querySelector(`select[name="place_${requestCount - 1}"]`);
        if (prevPlaceInput) {
            previousPlace = prevPlaceInput.value;
        } else if (prevPlaceSelect) {
            previousPlace = prevPlaceSelect.value;
        }
    }

    // 店舗が1つだけの場合の処理
    let placeSelectHTML;
    if (FORM_FIELDS.length === 1) {
        placeSelectHTML = `<input type="text" name="place_${requestCount}" value="${FORM_FIELDS[0]}" readonly class="readonly-input">`;
    } else if (requestCount > 1 && previousPlace) {
        // 2回目以降で前回の値がある場合
        placeSelectHTML = `
            <select name="place_${requestCount}" id="placeSelect_${requestCount}" required>
                <option value="">選択</option>
                <option value="${previousPlace}" selected>同上 (${previousPlace})</option>
                ${placeOptions}
            </select>`;
    } else {
        placeSelectHTML = `
            <select name="place_${requestCount}" id="placeSelect_${requestCount}" required>
                <option value="">選択</option>
                ${placeOptions}
            </select>`;
    }



    // 前回の依頼メンバー値を取得
    let previousMember = '';
    let previousMemberCustom = '';
    if (requestCount > 1) {
        const prevMemberSelect = document.querySelector(`select[name="member_${requestCount - 1}"]`);
        const prevMemberCustomInput = document.querySelector(`input[name="member_custom_${requestCount - 1}"]`);
        if (prevMemberSelect) {
            previousMember = prevMemberSelect.value;
        }
        if (prevMemberCustomInput) {
            previousMemberCustom = prevMemberCustomInput.value;
        }
    }

    // メンバー選択のHTML生成
    let memberSelectHTML = '';
    let memberCustomHTML = '';

    if (requestCount > 1 && (previousMember || previousMemberCustom)) {
        // 2回目以降で前回の値がある場合
        const displayText = previousMemberCustom || previousMember;
        memberSelectHTML = `
            <select class="member-select" name="member_${requestCount}" data-index="${requestCount}">
                <option value="">選択</option>
                <option value="${previousMember || '未登録者'}" selected>同上 (${displayText})</option>
                ${memberOptions}
                <option value="未登録者">未登録者</option>
            </select>`;
        memberCustomHTML = `<input class="member_custom" type="text" name="member_custom_${requestCount}" data-index="${requestCount}" placeholder="未登録者の場合はこちらに入力" value="${previousMemberCustom}">`;
    } else {
        // 初回
        memberSelectHTML = `
            <select class="member-select" name="member_${requestCount}" data-index="${requestCount}">
                <option value="">選択</option>
                ${memberOptions}
                <option value="未登録者">未登録者</option>
            </select>`;
        memberCustomHTML = `<input class="member_custom" type="text" name="member_custom_${requestCount}" data-index="${requestCount}" placeholder="未登録者の場合はこちらに入力">`;
    }




    const div = document.createElement("div");
    div.className = "request-set";

    // HTML生成
    div.innerHTML = `
        <div class="request-set-header">
            <h3 class="title2">フォームを入力してください</h3>
            <button type="button" class="delete-request-btn" data-request-id="${requestCount}">
                <i class="fas fa-times"></i> 削除
            </button>
        </div>

        <label class="main-label mark">店舗選択</label>
        <div class="select-wrapper">
            ${placeSelectHTML}
        </div>

        <div class="form-group required">
            <label class="main-label mark">依頼メンバー選択</label>
            <div class="select-wrapper">
                ${memberSelectHTML}
            </div>
            ${memberCustomHTML}
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

        <div class="work-category-wrapper" id="workCategoryWrapper_${requestCount}" style="display: none;">
            <label class="main-label mark">作業区分 <i class="far fa-question-circle question-icon"></i></label>

            <!-- グループ1用モーダル -->
            <div id="explanationModal_group1_${requestCount}" class="modal hidden explanation-modal" data-modal-group="group1">
                <div class="modal-content">
                    <span class="close-btn">&times;</span>
                    <p>
                    <strong>【作業区分の入力方法】</strong><br>
                    パターン数（何種類の制作をするか）を入力（最大9まで）、<br>
                    SETボタンを押すと、パターン数と同じ数の入力項目が表示される。<br>
                    各欄に（制作名・説明）を入力し、サイズ数（横 x 縦が異なる制作物がいくつ必要か）を入力（最大20まで）
                    </p>
                </div>
            </div>

            <!-- グループ2用モーダル -->
            <div id="explanationModal_group2_${requestCount}" class="modal hidden explanation-modal" data-modal-group="group2">
                <div class="modal-content">
                    <span class="close-btn">&times;</span>
                    <p>
                    <strong>【作業区分の入力方法】</strong><br>
                    パターン数（何種類の画像を制作するか）を入力（最大9まで）、<br>
                    SETボタンを押すと、パターン数と同じ数の入力項目が表示される。<br>
                    各欄に動画の長さや画像の用途を入力し、必要な枚数・本数を入力してください。
                    </p>
                </div>
            </div>

            <!-- グループ3用モーダル -->
            <div id="explanationModal_group3_${requestCount}" class="modal hidden explanation-modal" data-modal-group="group3">
                <div class="modal-content">
                    <span class="close-btn">&times;</span>
                    <p>
                    <strong>【印刷物制作の入力方法】</strong><br>
                    パターン数（何種類の印刷物を制作するか）を入力（最大9まで）、<br>
                    SETボタンを押すと、パターン数と同じ数の入力項目が表示される。<br>
                    各欄に印刷サイズ（A4、A3など）と枚数を入力してください。
                    </p>
                </div>
            </div>

            <!-- グループ4用モーダル -->
            <div id="explanationModal_group4_${requestCount}" class="modal hidden explanation-modal" data-modal-group="group4">
                <div class="modal-content">
                    <span class="close-btn">&times;</span>
                    <p>
                    <strong>【図面制作の入力方法】</strong><br>
                    パターン数（何種類の図面を制作するか）を入力（最大9まで）、<br>
                    SETボタンを押すと、パターン数と同じ数の入力項目が表示される。<br>
                    各欄に建物名や階数など、図面の詳細を入力してください。
                    </p>
                </div>
            </div>

            <!-- グループ5用モーダル -->
            <div id="explanationModal_group5_${requestCount}" class="modal hidden explanation-modal" data-modal-group="group5">
                <div class="modal-content">
                    <span class="close-btn">&times;</span>
                    <p>
                    <strong>【その他制作の入力方法】</strong><br>
                    パターン数（何種類の制作をするか）を入力（最大9まで）、<br>
                    SETボタンを押すと、パターン数と同じ数の入力項目が表示される。<br>
                    各欄に制作内容の詳細を入力してください。
                    </p>
                </div>
            </div>

            <!-- グループ1: バナー、料金表 で共通 -->
            <div class="category-box category-box-group1" data-business="バナー,料金表" style="display: none;">
                <div class="category-label-wrapper">
                    <div class="accordion-item" id="item-1_${requestCount}">
                        <div class="accordion-header">
                            <label class="category-label">
                                <input type="checkbox" class="enable-check" name="work_category_${requestCount}" value="新規作成">
                                <span class="item-title">新規作成</span>
                            </label>
                            <div class="input-group">
                                <span class="label-text">パターン数</span>
                                <input type="number" class="num-input pattern-count-input" min="1" max="9" placeholder="0">
                                <button type="button" class="set-btn">SET</button>
                            </div>
                        </div>
                        <div class="accordion-content">
                            <div class="rows-container"></div>
                            <div class="details-area">
                                <label class="main-label mark">内訳</label>
                                <textarea class="sync-target" name="details_new_${requestCount}"></textarea>
                            </div>
                        </div>
                    </div>

                    <div class="accordion-item" id="item-2_${requestCount}">
                        <div class="accordion-header">
                            <label class="category-label">
                                <input type="checkbox" class="enable-check" name="work_category_${requestCount}" value="修正">
                                <span class="item-title">修正</span>
                            </label>
                            <div class="input-group">
                                <span class="label-text">パターン数</span>
                                <input type="number" class="num-input pattern-count-input" min="1" max="9" placeholder="0">
                                <button type="button" class="set-btn">SET</button>
                            </div>
                        </div>
                        <div class="accordion-content">
                            <div class="rows-container"></div>
                            <div class="details-area">
                                <label class="main-label mark">内訳</label>
                                <textarea class="sync-target" name="details_modify_${requestCount}"></textarea>
                            </div>
                        </div>
                    </div>

                    <div class="accordion-item" id="item-3_${requestCount}">
                        <div class="accordion-header">
                            <label class="category-label">
                                <input type="checkbox" class="enable-check" name="work_category_${requestCount}" value="その他">
                                <span class="item-title">その他</span>
                            </label>
                            <div class="input-group">
                                <span class="label-text">パターン数</span>
                                <input type="number" class="num-input pattern-count-input" min="1" max="9" placeholder="0">
                                <button type="button" class="set-btn">SET</button>
                            </div>
                        </div>
                        <div class="accordion-content">
                            <div class="rows-container"></div>
                            <div class="details-area">
                                <label class="main-label mark">内訳</label>
                                <textarea class="sync-target" name="details_other_${requestCount}"></textarea>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- グループ2: グラビア、組織図 で共通 -->
            <div class="category-box category-box-group2" data-business="グラビア,組織図" style="display: none;">
                <div class="category-label-wrapper">
                    <div class="accordion-item" id="item-1_${requestCount}" data-group="group2">
                        <div class="accordion-header">
                            <label class="category-label">
                                <input type="checkbox" class="enable-check" name="work_category_${requestCount}" value="新規作成">
                                <span class="item-title">新規作成</span>
                            </label>
                            <div class="input-group">
                                <span class="label-text">制作数</span>
                                <input type="number" class="num-input pattern-count-input" min="1" max="9" placeholder="0">
                                <button type="button" class="set-btn">SET</button>
                            </div>
                        </div>
                        <div class="accordion-content">
                            <div class="rows-container"></div>
                            <div class="details-area">
                                <label class="main-label mark">内訳</label>
                                <textarea class="sync-target" name="details_new_${requestCount}"></textarea>
                            </div>
                        </div>
                    </div>

                    <div class="accordion-item" id="item-2_${requestCount}" data-group="group2">
                        <div class="accordion-header">
                            <label class="category-label">
                                <input type="checkbox" class="enable-check" name="work_category_${requestCount}" value="修正">
                                <span class="item-title">修正</span>
                            </label>
                            <div class="input-group">
                                <span class="label-text">制作数</span>
                                <input type="number" class="num-input pattern-count-input" min="1" max="9" placeholder="0">
                                <button type="button" class="set-btn">SET</button>
                            </div>
                        </div>
                        <div class="accordion-content">
                            <div class="rows-container"></div>
                            <div class="details-area">
                                <label class="main-label mark">内訳</label>
                                <textarea class="sync-target" name="details_modify_${requestCount}"></textarea>
                            </div>
                        </div>
                    </div>

                    <div class="accordion-item" id="item-3_${requestCount}" data-group="group2">
                        <div class="accordion-header">
                            <label class="category-label">
                                <input type="checkbox" class="enable-check" name="work_category_${requestCount}" value="その他">
                                <span class="item-title">その他</span>
                            </label>
                            <div class="input-group">
                                <span class="label-text">制作数</span>
                                <input type="number" class="num-input pattern-count-input" min="1" max="9" placeholder="0">
                                <button type="button" class="set-btn">SET</button>
                            </div>
                        </div>
                        <div class="accordion-content">
                            <div class="rows-container"></div>
                            <div class="details-area">
                                <label class="main-label mark">内訳</label>
                                <textarea class="sync-target" name="details_other_${requestCount}"></textarea>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- グループ3: LP、WEB、動画、画像全般、避難経路図、名刺、シール、のぼり、看板、その他 で共通 -->
            <div class="category-box category-box-group3" data-business="LP,WEB,動画,画像全般,避難経路図,名刺,シール,のぼり,看板,その他" style="display: none;">
                <!-- グループ3の作業区分 -->
            </div>

            <!-- グループ4: POPポスター で共通 -->
            <div class="category-box category-box-group4" data-business="POPポスター" style="display: none;">
                <!-- グループ4の作業区分 -->
            </div>
            <div class="main-block hidden" id="print-size-block_${requestCount}">
                <div class="grid-table">
                    <div class="grid-header">
                        <div class="grid-cell"></div>
                        <div class="grid-cell">A1</div>
                        <div class="grid-cell">A2</div>
                        <div class="grid-cell">A3</div>
                        <div class="grid-cell">A4</div>
                    </div>
                    <div class="grid-row">
                        <div class="grid-cell grid-label">普通紙(ﾗﾐﾈｰﾄ加工)</div>
                        <div class="grid-cell"><label class="grid-checkbox"><input type="checkbox" class="print-size-checkbox" data-type="普通紙(ﾗﾐﾈｰﾄ加工)" data-size="A1" data-textarea="note_${requestCount}"></label></div>
                        <div class="grid-cell"><label class="grid-checkbox"><input type="checkbox" class="print-size-checkbox" data-type="普通紙(ﾗﾐﾈｰﾄ加工)" data-size="A2" data-textarea="note_${requestCount}"></label></div>
                        <div class="grid-cell"><label class="grid-checkbox"><input type="checkbox" class="print-size-checkbox" data-type="普通紙(ﾗﾐﾈｰﾄ加工)" data-size="A3" data-textarea="note_${requestCount}"></label></div>
                        <div class="grid-cell"><label class="grid-checkbox"><input type="checkbox" class="print-size-checkbox" data-type="普通紙(ﾗﾐﾈｰﾄ加工)" data-size="A4" data-textarea="note_${requestCount}"></label></div>
                    </div>
                    <div class="grid-row">
                        <div class="grid-cell grid-label">写真紙(ﾗﾐﾈｰﾄ加工)</div>
                        <div class="grid-cell"><label class="grid-checkbox"><input type="checkbox" class="print-size-checkbox" data-type="写真紙(ﾗﾐﾈｰﾄ加工)" data-size="A1" data-textarea="note_${requestCount}"></label></div>
                        <div class="grid-cell"><label class="grid-checkbox"><input type="checkbox" class="print-size-checkbox" data-type="写真紙(ﾗﾐﾈｰﾄ加工)" data-size="A2" data-textarea="note_${requestCount}"></label></div>
                    </div>
                    <div class="grid-row">
                        <div class="grid-cell grid-label">内照紙(ﾗﾐﾈｰﾄ加工)</div>
                        <div class="grid-cell"><label class="grid-checkbox"><input type="checkbox" class="print-size-checkbox" data-type="内照紙(ﾗﾐﾈｰﾄ加工)" data-size="A1" data-textarea="note_${requestCount}"></label></div>
                        <div class="grid-cell"><label class="grid-checkbox"><input type="checkbox" class="print-size-checkbox" data-type="内照紙(ﾗﾐﾈｰﾄ加工)" data-size="A2" data-textarea="note_${requestCount}"></label></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="size-buttons">
            <button type="button" class="size-toggle-btn" data-target="banner-size-block_${requestCount}">バナーサイズ一覧</button>
            <button type="button" class="size-toggle-btn" data-target="print-size-block_${requestCount}">印刷サイズ一覧</button>
        </div>

        <div class="main-block hidden" id="banner-size-block_${requestCount}">

            <div class="checkbox-group" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                <label class="checkbox-label">
                    <input type="checkbox" name="size_banner_${requestCount}" value="1920x1080" class="size-checkbox" data-textarea="note_${requestCount}">
                    <span>1920x1080</span>
                </label>
                <label class="checkbox-label">
                    <input type="checkbox" name="size_banner_${requestCount}" value="640x640" class="size-checkbox" data-textarea="note_${requestCount}">
                    <span>640x640</span>
                </label>
                <label class="checkbox-label">
                    <input type="checkbox" name="size_banner_${requestCount}" value="976x211" class="size-checkbox" data-textarea="note_${requestCount}">
                    <span>976x211</span>
                </label>
                <label class="checkbox-label">
                    <input type="checkbox" name="size_banner_${requestCount}" value="750x470" class="size-checkbox" data-textarea="note_${requestCount}">
                    <span>750x470</span>
                </label>
                <label class="checkbox-label">
                    <input type="checkbox" name="size_banner_${requestCount}" value="700x300" class="size-checkbox" data-textarea="note_${requestCount}">
                    <span>700x300</span>
                </label>
                <label class="checkbox-label">
                    <input type="checkbox" name="size_banner_${requestCount}" value="580x250" class="size-checkbox" data-textarea="note_${requestCount}">
                    <span>580x250</span>
                </label>
                <label class="checkbox-label">
                    <input type="checkbox" name="size_banner_${requestCount}" value="1500x500" class="size-checkbox" data-textarea="note_${requestCount}">
                    <span>1500x500</span>
                </label>
            </div>
        </div>

        <label class="main-label">備考</label>
        <textarea class="note-box" name="note_${requestCount}"></textarea>
    `;

    document.getElementById("requestContainer").appendChild(div);

    // 業務区分の変更イベント
    const businessSelect = div.querySelector(`select[name="business_${requestCount}"]`);
    const workCategoryWrapper = div.querySelector(`#workCategoryWrapper_${requestCount}`);
    const allCategoryBoxes = div.querySelectorAll('.category-box');

    if (businessSelect && workCategoryWrapper) {
        businessSelect.addEventListener('change', function() {
            const selectedBusiness = this.value;

            if (selectedBusiness) {
                // 作業区分エリアを表示
                workCategoryWrapper.style.display = 'block';

                // すべてのcategory-boxを非表示
                allCategoryBoxes.forEach(box => {
                    box.style.display = 'none';
                });

                // すべてのモーダルを非表示（クラス名で一括取得）
                const allModals = div.querySelectorAll('.explanation-modal');
                allModals.forEach(modal => {
                    modal.classList.add('hidden');
                });

                // 選択された業務区分に対応するcategory-boxとモーダルを探して表示
                let foundBox = false;
                let currentGroup = '';

                allCategoryBoxes.forEach(box => {
                    const businessList = box.getAttribute('data-business');
                    if (businessList) {
                        // カンマ区切りの業務区分リストを配列に変換
                        const businesses = businessList.split(',').map(b => b.trim());
                        // 選択された業務区分が含まれているか確認
                        if (businesses.includes(selectedBusiness)) {
                            box.style.display = 'block';
                            foundBox = true;

                            // グループ名を取得（例: category-box-group1 → group1）
                            const classList = box.className.split(' ');
                            const groupClass = classList.find(c => c.startsWith('category-box-group'));
                            if (groupClass) {
                                currentGroup = groupClass.replace('category-box-group', 'group');
                            }
                        }
                    }
                });

                // 対応するグループのモーダルを表示可能な状態にする（hidden解除はしない、クリック時に表示）
                // currentGroupを保存しておく
                if (currentGroup) {
                    workCategoryWrapper.setAttribute('data-current-group', currentGroup);
                }

                // 該当するboxが見つからない場合の処理（オプション）
                if (!foundBox) {
                    console.warn(`業務区分 "${selectedBusiness}" に対応するcategory-boxが見つかりません`);
                }
            } else {
                // 未選択の場合は作業区分エリアを非表示
                workCategoryWrapper.style.display = 'none';
            }
        });
    }


    // 依頼メンバーのバリデーション処理
    const memberSelect = div.querySelector(`select[name="member_${requestCount}"]`);
    const memberCustomInput = div.querySelector(`input[name="member_custom_${requestCount}"]`);

    if (memberSelect && memberCustomInput) {
        // セレクトボックス変更時の処理
        memberSelect.addEventListener('change', function() {
            if (this.value === '未登録者') {
                // 未登録者を選択した場合、カスタム入力を必須にする
                memberCustomInput.setAttribute('required', 'required');
                memberCustomInput.style.borderColor = '#ff6b6b';
            } else if (this.value !== '') {
                // 登録メンバーを選択した場合、カスタム入力の必須を解除
                memberCustomInput.removeAttribute('required');
                memberCustomInput.style.borderColor = '';
                memberCustomInput.value = ''; // 入力値をクリア
            } else {
                // 未選択の場合
                memberCustomInput.removeAttribute('required');
                memberCustomInput.style.borderColor = '';
            }
        });

        // カスタム入力フィールドの入力時の処理
        memberCustomInput.addEventListener('input', function() {
            if (this.value.trim() !== '') {
                // カスタム入力に値がある場合、セレクトの必須を解除
                memberSelect.removeAttribute('required');
            } else {
                // カスタム入力が空の場合、セレクトを必須に戻す
                memberSelect.setAttribute('required', 'required');
            }
        });
    }

    // モーダル制御 - グループに応じたモーダルを表示
    const questionIcon = div.querySelector('.question-icon');
    const allModals = div.querySelectorAll('.explanation-modal');

    if (questionIcon) {
        questionIcon.addEventListener('click', (e) => {
            e.preventDefault();

            // 現在選択されているグループを取得
            const currentGroup = workCategoryWrapper.getAttribute('data-current-group');

            if (currentGroup) {
                // 該当グループのモーダルを探して表示
                const targetModal = div.querySelector(`#explanationModal_${currentGroup}_${requestCount}`);
                if (targetModal) {
                    targetModal.classList.remove('hidden');
                }
            }
        });
    }

    // すべてのモーダルに閉じるボタンのイベントを設定
    allModals.forEach(modal => {
        const closeBtn = modal.querySelector('.close-btn');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.add('hidden');
            });
        }

        // モーダル外クリックで閉じる処理
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    });


    // SETボタンとアコーディオンのイベント設定(動的に追加された要素用)
    div.querySelectorAll('.accordion-item').forEach(item => {
        const setBtn = item.querySelector('.set-btn');
        const patternCountInput = item.querySelector('.pattern-count-input');
        const contentArea = item.querySelector('.accordion-content');
        const rowsContainer = item.querySelector('.rows-container');
        const syncTextarea = item.querySelector('.sync-target');

        // SETボタンクリック時の処理
        setBtn.addEventListener('click', () => {
            let count = parseInt(patternCountInput.value, 10);

            // バリデーション:1〜9の間
            if (isNaN(count) || count <= 0) return;
            if (count > 9) {
                alert('最大9までしか入力できません');
                patternCountInput.value = 9;
                count = 9;
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

                // 「サイズ数」ラベル
                const sizeLabel = document.createElement('span');
                sizeLabel.textContent = 'サイズ数';
                sizeLabel.className = 'label-text';

                // サイズ数入力 (数字2桁)
                const sizeInput = document.createElement('input');
                sizeInput.type = 'number';
                sizeInput.className = 'num-input size-count-input';
                sizeInput.min = '0';
                sizeInput.max = '20';
                sizeInput.placeholder = '0';

                // イベントリスナー追加(入力時に同期処理を走らせる)
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

        // 入力制限(数字2桁、最大20)
        item.addEventListener('input', (e) => {
            if (e.target.classList.contains('num-input')) {
                let val = parseInt(e.target.value, 10);
                if (val > 20) e.target.value = 20;
                // 文字数制限(2桁)
                if (e.target.value.length > 2) {
                    e.target.value = e.target.value.slice(0, 2);
                }
            }
        });

        // 同期処理関数
        function updateDetails() {
            const rows = rowsContainer.querySelectorAll('.generated-row');
            let resultString = '';

            rows.forEach((row, index) => {
                const pInput = row.querySelector('.pattern-text-input');
                const sInput = row.querySelector('.size-count-input');

                // パターン名:入力があればそれ、なければplaceholderの値を使う
                const pName = pInput.value.trim() !== '' ? pInput.value : pInput.placeholder;

                // サイズ数:入力があればそれ、なければ空(または0)
                const sCount = sInput.value;

                // サイズ数が入力されている場合のみ文字列に追加
                if (sCount) {
                    resultString += `${pName}:${sCount}サイズ、`;
                }
            });

            syncTextarea.value = resultString;
        }
    });


    // サイズボタンのトグル処理
    const sizeButtons = document.querySelectorAll('.size-toggle-btn');

    sizeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.dataset.target;
            const targetBlock = document.getElementById(targetId);

            if (targetBlock) {
                targetBlock.classList.toggle('hidden');

                // ボタンのテキストを変更するロジック
                if (targetBlock.classList.contains('hidden')) {
                    // 隠れた → テキストを「一覧 ＋」に戻す
                    this.innerHTML = 'CLOSE <i class="fas fa-plus-circle"></i>';
                } else {
                    // 表示された → テキストを「一覧 −」にする
                    this.innerHTML = 'CLOSE <i class="fas fa-minus-circle"></i>';
                }
            }
        });
    });

    // バナーサイズチェックボックスのイベント
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

    // 印刷サイズチェックボックスのイベント
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

    // 削除ボタンのイベント
    const deleteBtn = div.querySelector('.delete-request-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            if (requestCount <= 1) {
                alert('最低1つのフォームは必要です。');
                return;
            }
            if (confirm('このフォームを削除しますか?')) {
                div.remove();
                // requestCountは減らさない(IDの一意性を保つため)
            }
        });
    }
}

// イベントハンドラの設定を関数化(初期化後に呼ぶため)
function setupEventHandlers() {
    document.getElementById("addRequest").addEventListener("click", createRequestSet);

    document.getElementById("mainForm").addEventListener("submit", async function(e) {
        e.preventDefault();

        // カスタムバリデーション: 依頼メンバーのチェック
        let validationError = false;
        for (let i = 1; i <= requestCount; i++) {
            const memberSelect = document.querySelector(`select[name="member_${i}"]`);
            const memberCustomInput = document.querySelector(`input[name="member_custom_${i}"]`);

            if (memberSelect && memberCustomInput) {
                const selectValue = memberSelect.value;
                const customValue = memberCustomInput.value.trim();

                // セレクトが未選択 かつ カスタム入力も空の場合
                if (selectValue === '' && customValue === '') {
                    alert('依頼メンバーを選択するか、未登録者の名前を入力してください。');
                    memberSelect.focus();
                    validationError = true;
                    break;
                }

                // 未登録者を選択したのにカスタム入力が空の場合
                if (selectValue === '未登録者' && customValue === '') {
                    alert('未登録者を選択した場合は、名前を入力してください。');
                    memberCustomInput.focus();
                    validationError = true;
                    break;
                }
            }
        }

        if (validationError) {
            return;
        }

        const submitBtn = document.getElementById("submitBtn");
        const resultDiv = document.getElementById("result");

        // ボタンを無効化
        submitBtn.disabled = true;
        submitBtn.textContent = '・・・送信中・・・';
        resultDiv.style.display = 'none';

        const formData = new FormData(this);
        const requests = [];

        for (let i = 1; i <= requestCount; i++) {
            // チェックボックスの値収集
            const checkedCategories = document.querySelectorAll(`input[name="work_category_${i}"]:checked`);

            // メンバー名の決定
            let memberName = formData.get(`member_${i}`);
            const memberCustom = formData.get(`member_custom_${i}`);
            if (memberCustom && memberCustom.trim() !== '') {
                memberName = memberCustom;
            }

            // 共通データ
            const commonData = {
                member: memberName,
                member_custom: memberCustom,
                group: CONFIG.GROUP_NAME_FROM_SHEET,
                place: formData.get(`place_${i}`),
                business: formData.get(`business_${i}`),
                note: formData.get(`note_${i}`)
            };

            // 作業区分が選択されていない場合は1行だけ作成
            if (checkedCategories.length === 0) {
                requests.push({
                    ...commonData,
                    category: '',
                    details: ''
                });
            } else {
                // 各作業区分ごとに行を作成
                checkedCategories.forEach(checkbox => {
                    const categoryValue = checkbox.value;
                    let detailsValue = '';

                    // 対応するtextareaから内訳を取得
                    if (categoryValue === '新規作成') {
                        detailsValue = formData.get(`details_new_${i}`) || '';
                    } else if (categoryValue === '修正') {
                        detailsValue = formData.get(`details_modify_${i}`) || '';
                    } else if (categoryValue === 'その他') {
                        detailsValue = formData.get(`details_other_${i}`) || '';
                    }

                    requests.push({
                        ...commonData,
                        category: categoryValue,
                        details: detailsValue
                    });
                });
            }
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