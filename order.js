
// ビルド時に埋め込まれる設定値 ---
const GAS_ID = "m2";
const GAS_URL = "AKfycbz8rD4E4qGciZcR2afsCpm6PyccW82cmun6azwQoXWwjOT985tKKb99WQcUJfFnFLAE4Q";

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

    // 削除ボタンのHTML生成（2つ目以降のみ表示）
    const deleteButtonHTML = requestCount > 1 ? `
        <button type="button" class="delete-request-btn" data-request-id="${requestCount}">
            <i class="fas fa-times"></i> 削除
        </button>
    ` : '';

    const div = document.createElement("div");
    div.className = "request-set";
    div.setAttribute('data-request-id', requestCount);

    // HTML生成
    div.innerHTML = `
        <div class="request-set-header">
            <h3 class="title2">フォームを入力してください</h3>
            ${deleteButtonHTML}
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
                            <div class="pattern-rows-container"></div>
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
                            <div class="pattern-rows-container"></div>
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
                            <div class="pattern-rows-container"></div>
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
                            <div class="pattern-rows-container"></div>
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
                            <div class="pattern-rows-container"></div>
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
                            <div class="pattern-rows-container"></div>
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
                <p class="size-help-text">クリックで内容欄に追加されます（最後にフォーカスした内容欄が対象）</p>
                <div class="button-group" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
                    <!-- 普通紙 -->
                    <button type="button" class="print-size-insert-btn" data-print-size="普通紙(ﾗﾐﾈｰﾄ加工) A1">普通紙 A1</button>
                    <button type="button" class="print-size-insert-btn" data-print-size="普通紙(ﾗﾐﾈｰﾄ加工) A2">普通紙 A2</button>
                    <button type="button" class="print-size-insert-btn" data-print-size="普通紙(ﾗﾐﾈｰﾄ加工) A3">普通紙 A3</button>
                    <button type="button" class="print-size-insert-btn" data-print-size="普通紙(ﾗﾐﾈｰﾄ加工) A4">普通紙 A4</button>
                    <!-- 写真紙 -->
                    <button type="button" class="print-size-insert-btn" data-print-size="写真紙(ﾗﾐﾈｰﾄ加工) A1">写真紙 A1</button>
                    <button type="button" class="print-size-insert-btn" data-print-size="写真紙(ﾗﾐﾈｰﾄ加工) A2">写真紙 A2</button>
                    <!-- 内照紙 -->
                    <button type="button" class="print-size-insert-btn" data-print-size="内照紙(ﾗﾐﾈｰﾄ加工) A1">内照紙 A1</button>
                    <button type="button" class="print-size-insert-btn" data-print-size="内照紙(ﾗﾐﾈｰﾄ加工) A2">内照紙 A2</button>
                </div>
            </div>
        </div>

        <div class="size-buttons" id="sizeButtonsWrapper_${requestCount}" style="display: none;">
            <button type="button" class="size-toggle-btn" id="bannerSizeBtn_${requestCount}" data-target="banner-size-block_${requestCount}" style="display: none;">バナーサイズ一覧</button>
            <button type="button" class="size-toggle-btn" id="printSizeBtn_${requestCount}" data-target="print-size-block_${requestCount}" style="display: none;">印刷サイズ一覧</button>
        </div>

        <div class="main-block hidden" id="banner-size-block_${requestCount}">
            <p class="size-help-text">クリックで内容欄に追加されます（最後にフォーカスした内容欄が対象）</p>
            <div class="button-group" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                <button type="button" class="size-insert-btn" data-size="1920x1080">1920x1080</button>
                <button type="button" class="size-insert-btn" data-size="640x640">640x640</button>
                <button type="button" class="size-insert-btn" data-size="976x211">976x211</button>
                <button type="button" class="size-insert-btn" data-size="750x470">750x470</button>
                <button type="button" class="size-insert-btn" data-size="700x300">700x300</button>
                <button type="button" class="size-insert-btn" data-size="580x250">580x250</button>
                <button type="button" class="size-insert-btn" data-size="1500x500">1500x500</button>
            </div>
        </div>

        <label class="main-label">ZIP</label>
        <div class="zip-upload-area" id="zipUploadArea_${requestCount}">
            <div class="zip-dropzone" id="zipDropzone_${requestCount}">
                <i class="fas fa-cloud-upload-alt"></i>
                <p>ZIPファイルをドラッグ＆ドロップ<br>または</p>
                <button type="button" class="file-select-btn" id="fileSelectBtn_${requestCount}">ファイルを選択</button>
                <input type="file" id="zipFileInput_${requestCount}" accept=".zip" style="display: none;">
                <p class="file-info">ファイル形式: ZIP / 最大容量: 100MB</p>
            </div>
            <div class="zip-file-list" id="zipFileList_${requestCount}"></div>
        </div>
    `;

    document.getElementById("requestContainer").appendChild(div);

    // ZIPファイルアップロード機能の初期化
    setupZipUpload(requestCount);

    // 業務区分の変更イベント
    const businessSelect = div.querySelector(`select[name="business_${requestCount}"]`);
    const workCategoryWrapper = div.querySelector(`#workCategoryWrapper_${requestCount}`);
    const allCategoryBoxes = div.querySelectorAll('.category-box');

    if (businessSelect && workCategoryWrapper) {
        businessSelect.addEventListener('change', function() {
            const selectedBusiness = this.value;
            const sizeButtonsWrapper = div.querySelector(`#sizeButtonsWrapper_${requestCount}`);
            const bannerSizeBtn = div.querySelector(`#bannerSizeBtn_${requestCount}`);
            const printSizeBtn = div.querySelector(`#printSizeBtn_${requestCount}`);

            if (selectedBusiness) {
                // 作業区分エリアを表示
                workCategoryWrapper.style.display = 'block';

                // サイズボタンの表示制御
                if (sizeButtonsWrapper) {
                    sizeButtonsWrapper.style.display = 'block';

                    // バナーサイズボタンの表示判定
                    if (bannerSizeBtn) {
                        bannerSizeBtn.style.display = (selectedBusiness === 'バナー') ? 'inline-block' : 'none';
                    }

                    // 印刷サイズボタンの表示判定
                    const printBusinesses = ['料金表', '画像全般', 'POPポスター', '看板', '避難経路図'];
                    if (printSizeBtn) {
                        printSizeBtn.style.display = printBusinesses.includes(selectedBusiness) ? 'inline-block' : 'none';
                    }
                }

                // すべてのcategory-boxを非表示
                allCategoryBoxes.forEach(box => {
                    box.style.display = 'none';
                });

                // すべてのモーダルを非表示
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
                        const businesses = businessList.split(',').map(b => b.trim());
                        if (businesses.includes(selectedBusiness)) {
                            box.style.display = 'block';
                            foundBox = true;

                            const classList = box.className.split(' ');
                            const groupClass = classList.find(c => c.startsWith('category-box-group'));
                            if (groupClass) {
                                currentGroup = groupClass.replace('category-box-group', 'group');
                            }
                        }
                    }
                });

                if (currentGroup) {
                    workCategoryWrapper.setAttribute('data-current-group', currentGroup);
                }

                if (!foundBox) {
                    console.warn(`業務区分 "${selectedBusiness}" に対応するcategory-boxが見つかりません`);
                }
            } else {
                // 未選択の場合は作業区分エリアとサイズボタンを非表示
                workCategoryWrapper.style.display = 'none';
                if (sizeButtonsWrapper) {
                    sizeButtonsWrapper.style.display = 'none';
                }
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
        const patternRowsContainer = item.querySelector('.pattern-rows-container');

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
            patternRowsContainer.innerHTML = '';

            // 作業区分の値を取得
            const categoryValue = item.querySelector('.enable-check').value;

            for (let i = 1; i <= count; i++) {
                // パターンごとのブロックを作成
                const patternBlock = document.createElement('div');
                patternBlock.className = 'pattern-block';
                patternBlock.setAttribute('data-pattern-index', i);

                // パターン名入力とサイズ数入力の行
                const rowDiv = document.createElement('div');
                rowDiv.className = 'generated-row';

                // パターン名入力 (編集可能なテキスト)
                const patternInput = document.createElement('input');
                patternInput.type = 'text';
                patternInput.className = 'pattern-text-input';
                patternInput.name = `pattern_text_${requestCount}_${categoryValue}_${i}`;
                patternInput.placeholder = `パターン${i}`;

                // 「サイズ数」ラベル
                const sizeLabel = document.createElement('span');
                sizeLabel.textContent = 'サイズ数';
                sizeLabel.className = 'label-text';

                // サイズ数入力 (数字2桁)
                const sizeInput = document.createElement('input');
                sizeInput.type = 'number';
                sizeInput.className = 'num-input size-count-input';
                sizeInput.name = `size_count_${requestCount}_${categoryValue}_${i}`;
                sizeInput.min = '0';
                sizeInput.max = '20';
                sizeInput.placeholder = '0';

                // 要素を追加
                rowDiv.appendChild(patternInput);
                rowDiv.appendChild(sizeLabel);
                rowDiv.appendChild(sizeInput);

                patternBlock.appendChild(rowDiv);

                // 内容のtextarea
                const detailsDiv = document.createElement('div');
                detailsDiv.className = 'details-area';

                const detailsLabelDiv = document.createElement('div');
                detailsLabelDiv.className = 'details-label-wrapper';

                const detailsLabel = document.createElement('label');
                detailsLabel.className = 'main-label mark';
                detailsLabel.textContent = `内容${i}`;

                detailsLabelDiv.appendChild(detailsLabel);

                const detailsTextarea = document.createElement('textarea');
                detailsTextarea.className = 'sync-target';
                detailsTextarea.name = `details_${requestCount}_${categoryValue}_${i}`;

                detailsDiv.appendChild(detailsLabelDiv);
                detailsDiv.appendChild(detailsTextarea);

                patternBlock.appendChild(detailsDiv);

                // 備考のtextarea
                const noteDiv = document.createElement('div');
                noteDiv.className = 'note-area';

                const noteLabel = document.createElement('label');
                noteLabel.className = 'main-label';
                noteLabel.textContent = `備考${i}`;

                const noteTextarea = document.createElement('textarea');
                noteTextarea.className = 'note-box';
                noteTextarea.name = `note_${requestCount}_${categoryValue}_${i}`;

                noteDiv.appendChild(noteLabel);
                noteDiv.appendChild(noteTextarea);

                patternBlock.appendChild(noteDiv);

                patternRowsContainer.appendChild(patternBlock);

                // 同期処理のイベントリスナーを追加
                const updateDetails = () => {
                    const pName = patternInput.value.trim() !== '' ? patternInput.value : patternInput.placeholder;
                    const sCount = sizeInput.value;

                    if (sCount) {
                        detailsTextarea.value = `${pName}:${sCount}サイズ`;
                    } else {
                        detailsTextarea.value = '';
                    }
                };

                patternInput.addEventListener('input', updateDetails);
                sizeInput.addEventListener('input', updateDetails);
            }

            // エリアを表示する
            contentArea.classList.add('active');
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
    });

    // サイズボタンのトグル処理
    const sizeButtons = div.querySelectorAll('.size-toggle-btn');

    // 印刷サイズ挿入ボタンのイベント
    const printInsertButtons = div.querySelectorAll('.print-size-insert-btn');
    printInsertButtons.forEach(button => {
        button.addEventListener('click', function() {
            const printSize = this.getAttribute('data-print-size');

            if (!lastFocusedDetailsTextarea) {
                alert('内容欄をクリックしてから、サイズを選択してください');
                return;
            }

            // 現在の値に追加
            const currentValue = lastFocusedDetailsTextarea.value;
            if (currentValue && !currentValue.endsWith(',')) {
                lastFocusedDetailsTextarea.value = currentValue + ',' + printSize + ',';
            } else if (currentValue) {
                lastFocusedDetailsTextarea.value = currentValue + printSize + ',';
            } else {
                lastFocusedDetailsTextarea.value = printSize + ',';
            }

            // フォーカスを戻す
            lastFocusedDetailsTextarea.focus();
        });
    });

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

    // 最後にフォーカスされた内容textareaを追跡
    let lastFocusedDetailsTextarea = null;

    // すべての内容textareaにフォーカスイベントを設定
    div.addEventListener('focusin', (e) => {
        if (e.target.classList.contains('sync-target')) {
            lastFocusedDetailsTextarea = e.target;
        }
    });

    // バナーサイズ挿入ボタンのイベント
    const sizeInsertButtons = div.querySelectorAll('.size-insert-btn');
    sizeInsertButtons.forEach(button => {
        button.addEventListener('click', function() {
            const sizeValue = this.dataset.size;

            if (!lastFocusedDetailsTextarea) {
                alert('内容欄をクリックしてから、サイズを選択してください');
                return;
            }

            // 現在の値に追加
            const currentValue = lastFocusedDetailsTextarea.value;
            if (currentValue && !currentValue.endsWith(',')) {
                lastFocusedDetailsTextarea.value = currentValue + ',' + sizeValue + ',';
            } else if (currentValue) {
                lastFocusedDetailsTextarea.value = currentValue + sizeValue + ',';
            } else {
                lastFocusedDetailsTextarea.value = sizeValue + ',';
            }

            // フォーカスを戻す
            lastFocusedDetailsTextarea.focus();
        });
    });

    // 削除ボタンのイベント
    const deleteBtn = div.querySelector('.delete-request-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            const remainingSets = document.querySelectorAll('.request-set').length;
            if (remainingSets <= 1) {
                alert('最低1つのフォームは必要です。');
                return;
            }
            if (confirm('このフォームを削除しますか?')) {
                div.remove();
            }
        });
    }
}

// ZIPファイルアップロード機能のセットアップ
function setupZipUpload(requestId) {
    const dropzone = document.getElementById(`zipDropzone_${requestId}`);
    const fileInput = document.getElementById(`zipFileInput_${requestId}`);
    const fileSelectBtn = document.getElementById(`fileSelectBtn_${requestId}`);
    const fileList = document.getElementById(`zipFileList_${requestId}`);

    // ファイル選択ボタンのクリックイベント
    fileSelectBtn.addEventListener('click', () => {
        fileInput.click();
    });

    // ファイル選択時の処理
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files, requestId);
    });

    // ドラッグオーバー時の処理
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });

    // ドラッグリーブ時の処理
    dropzone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
    });

    // ドロップ時の処理
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        handleFiles(e.dataTransfer.files, requestId);
    });
}

// ファイル処理関数
function handleFiles(files, requestId) {
    const fileList = document.getElementById(`zipFileList_${requestId}`);
    const maxSize = 100 * 1024 * 1024; // 100MB

    Array.from(files).forEach(file => {
        // ZIPファイルかチェック
        if (!file.name.toLowerCase().endsWith('.zip')) {
            alert(`${file.name} はZIPファイルではありません。`);
            return;
        }

        // ファイルサイズチェック
        if (file.size > maxSize) {
            alert(`${file.name} のサイズが500MBを超えています。`);
            return;
        }

        // ファイル情報を表示
        const fileItem = document.createElement('div');
        fileItem.className = 'zip-file-item';
        fileItem.innerHTML = `
            <i class="fas fa-file-archive"></i>
            <span class="file-name">${file.name}</span>
            <span class="file-size">(${(file.size / 1024 / 1024).toFixed(2)} MB)</span>
            <button type="button" class="remove-file-btn" data-file-name="${file.name}">
                <i class="fas fa-times"></i>
            </button>
        `;

        fileList.appendChild(fileItem);

        // ファイルをBase64に変換して保存
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64Data = e.target.result.split(',')[1];

            // データURIスキームが正しく含まれているか確認
            if (base64Data) {
                fileItem.setAttribute('data-file-base64', base64Data);
                fileItem.setAttribute('data-file-name', file.name);
                fileItem.setAttribute('data-file-size', file.size);
            } else {
                console.error('Base64変換に失敗しました:', file.name);
            }
        };
        reader.readAsDataURL(file);

        // 削除ボタンのイベント
        const removeBtn = fileItem.querySelector('.remove-file-btn');
        removeBtn.addEventListener('click', () => {
            fileItem.remove();
        });
    });
}

// イベントハンドラの設定を関数化(初期化後に呼ぶため)
function setupEventHandlers() {
    document.getElementById("addRequest").addEventListener("click", createRequestSet);

    document.getElementById("mainForm").addEventListener("submit", async function(e) {
        e.preventDefault();

        // カスタムバリデーション: 依頼メンバーのチェック
        const requestSets = document.querySelectorAll('.request-set');
        let validationError = false;

        for (const requestSet of requestSets) {
            const requestId = requestSet.getAttribute('data-request-id');
            const memberSelect = requestSet.querySelector(`select[name="member_${requestId}"]`);
            const memberCustomInput = requestSet.querySelector(`input[name="member_custom_${requestId}"]`);

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

        const requests = [];
        const zipFiles = [];

        // 各request-setを処理
        for (const requestSet of requestSets) {
            const requestId = requestSet.getAttribute('data-request-id');

            // メンバー名の決定
            const memberSelect = requestSet.querySelector(`select[name="member_${requestId}"]`);
            const memberCustomInput = requestSet.querySelector(`input[name="member_custom_${requestId}"]`);
            let memberName = memberSelect ? memberSelect.value : '';
            const memberCustom = memberCustomInput ? memberCustomInput.value : '';
            if (memberCustom && memberCustom.trim() !== '') {
                memberName = memberCustom;
            }

            // 店舗名の取得
            const placeInput = requestSet.querySelector(`input[name="place_${requestId}"]`);
            const placeSelect = requestSet.querySelector(`select[name="place_${requestId}"]`);
            const place = placeInput ? placeInput.value : (placeSelect ? placeSelect.value : '');

            // 業務区分の取得
            const businessSelect = requestSet.querySelector(`select[name="business_${requestId}"]`);
            const business = businessSelect ? businessSelect.value : '';

            // チェックされた作業区分を取得
            const checkedCategories = requestSet.querySelectorAll(`input[name="work_category_${requestId}"]:checked`);

            // ZIPファイルの取得
            const zipFileItems = requestSet.querySelectorAll('.zip-file-item');
            console.log('request-set ' + requestId + ' のZIPファイル数:', zipFileItems.length);

            zipFileItems.forEach(item => {
                const base64Data = item.getAttribute('data-file-base64');
                const fileName = item.getAttribute('data-file-name');
                const fileSize = item.getAttribute('data-file-size');

                console.log('ZIPファイル情報:', {
                    requestId: requestId,
                    fileName: fileName,
                    fileSize: fileSize,
                    hasBase64: !!base64Data,
                    base64Length: base64Data ? base64Data.length : 0
                });

                if (base64Data) {
                    zipFiles.push({
                        requestId: requestId,
                        place: place,
                        fileName: fileName,
                        fileSize: fileSize,
                        base64Data: base64Data
                    });
                } else {
                    console.warn('base64Dataが空です:', fileName);
                }
            });

            // 共通データ
            const commonData = {
                requestId: requestId,
                member: memberName,
                member_custom: memberCustom,
                group: CONFIG.GROUP_NAME_FROM_SHEET,
                place: place,
                business: business
            };

            // 作業区分が選択されていない場合は1行だけ作成
            if (checkedCategories.length === 0) {
                requests.push({
                    ...commonData,
                    category: '',
                    details: '',
                    pattern: '',
                    sizeCount: '',
                    note: ''
                });
            } else {
                // 各作業区分ごとにパターンを処理
                checkedCategories.forEach(checkbox => {
                    const categoryValue = checkbox.value;

                    // この作業区分に対応するアコーディオンアイテムを取得
                    const accordionItem = Array.from(requestSet.querySelectorAll('.accordion-item')).find(item => {
                        const enableCheck = item.querySelector('.enable-check');
                        return enableCheck && enableCheck.value === categoryValue && enableCheck.checked;
                    });

                    // パターンブロックを取得（この作業区分のもののみ）
                    const patternBlocks = accordionItem ? accordionItem.querySelectorAll('.pattern-block') : [];

                    if (patternBlocks.length === 0) {
                        // パターンが設定されていない場合は1行だけ作成
                        requests.push({
                            ...commonData,
                            category: categoryValue,
                            details: '',
                            pattern: '',
                            sizeCount: '',
                            note: ''
                        });
                    } else {
                        // 各パターンごとに行を作成
                        patternBlocks.forEach((block, index) => {
                            const patternIndex = index + 1;

                            const patternTextInput = block.querySelector(`input[name="pattern_text_${requestId}_${categoryValue}_${patternIndex}"]`);
                            const sizeCountInput = block.querySelector(`input[name="size_count_${requestId}_${categoryValue}_${patternIndex}"]`);
                            const detailsTextarea = block.querySelector(`textarea[name="details_${requestId}_${categoryValue}_${patternIndex}"]`);
                            const noteTextarea = block.querySelector(`textarea[name="note_${requestId}_${categoryValue}_${patternIndex}"]`);

                            const patternText = patternTextInput ? (patternTextInput.value || patternTextInput.placeholder) : '';
                            const sizeCount = sizeCountInput ? sizeCountInput.value : '';
                            const details = detailsTextarea ? detailsTextarea.value : '';
                            const note = noteTextarea ? noteTextarea.value : '';

                            requests.push({
                                ...commonData,
                                category: categoryValue,
                                pattern: patternText,
                                sizeCount: sizeCount,
                                details: details,
                                note: note
                            });
                        });
                    }
                });
            }
        }

        try {
            // ZIPファイルデータを整形
            const zipFilesData = zipFiles.map(zipFile => ({
                requestId: zipFile.requestId,
                place: zipFile.place,
                fileName: zipFile.fileName,
                base64Data: zipFile.base64Data
            }));

            // リクエストデータを作成
            const requestData = {
                requests: requests,
                zipFiles: zipFilesData,
                auth_password: CONFIG.AUTH_PASSWORD
            };

            const jsonData = JSON.stringify(requestData);
            console.log('送信データサイズ:', (jsonData.length / 1024 / 1024).toFixed(2), 'MB');
            console.log('ZIPファイル数:', zipFilesData.length);
            if (zipFilesData.length > 0) {
                console.log('ZIPファイル詳細:', zipFilesData.map(z => ({
                    requestId: z.requestId,
                    place: z.place,
                    fileName: z.fileName,
                    base64Length: z.base64Data ? z.base64Data.length : 0
                })));
            }

            // POSTリクエスト送信（GAS用にパラメータ形式で送信）
            const response = await fetch(ENDPOINT, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: jsonData
            });

            // no-corsモードの場合、レスポンスは読み取れないため成功と判定
            console.log('送信完了（no-corsモード）');

            // 少し待ってから成功と判定
            await new Promise(resolve => setTimeout(resolve, 1000));

            const result = { result: 'success' };

            if (result.result === 'success') {
                resultDiv.textContent = "送信が完了しました!";
                resultDiv.className = 'success';
                resultDiv.style.display = 'block';

                // フォームをリセット
                this.reset();
                document.getElementById("requestContainer").innerHTML = "";
                requestCount = 0;
                createRequestSet();
                updateMemberDropdowns();
            } else {
                throw new Error(result.message || '送信に失敗しました');
            }
        } catch (error) {
            console.error('Error:', error);
            console.error('Error details:', error.message);

            // より詳細なエラー情報を表示
            let errorMessage = `送信に失敗しました。\nエラー: ${error.message}`;
            if (error.stack) {
                console.error('Error stack:', error.stack);
            }

            resultDiv.textContent = errorMessage;
            resultDiv.className = 'error';
            resultDiv.style.display = 'block';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '送信';
        }
    });
}

// DOM読み込み完了後に認証フロー(initApp)を開始
document.addEventListener('DOMContentLoaded', initApp);