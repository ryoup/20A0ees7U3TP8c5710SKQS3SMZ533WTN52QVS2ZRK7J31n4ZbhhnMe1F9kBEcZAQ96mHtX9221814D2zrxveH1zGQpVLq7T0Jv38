document.getElementById("uploadForm").addEventListener("submit", function(e) {
    e.preventDefault(); // ページリロードを防止

    const fileInput = document.getElementById("fileInput");
    if (fileInput.files.length === 0) {
        alert("画像を選択してください！");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function() {
        const img = new Image();
        img.onload = function() {
            let newWidth = img.width;
            let newHeight = img.height;

            // 横幅が1080でなかったら、縦横比を保ってリサイズ
            if (newWidth !== 1080) {
                const scaleFactor = 1080 / newWidth;
                newWidth = 1080;
                newHeight = Math.round(img.height * scaleFactor);
            }

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            canvas.width = newWidth;
            canvas.height = newHeight;
            ctx.drawImage(img, 0, 0, newWidth, newHeight);

            const imageData = ctx.getImageData(0, 0, newWidth, newHeight);
            const data = imageData.data;

            const xCoords = [150, 250]; // G>=200, B<=10 を満たす x
            const xTargets = [218, 435, 650, 867]; // R>=200, G<=100, B<=100 を満たす x

            let minCommonY = null; // x=150, 250 の両方で条件を満たす最小 y
            let minYForX = {}; // 各 x 座標で条件を満たす最小 y (1300以上)

            // 各ターゲット x 座標の初期値を設定
            xTargets.forEach(x => {
                minYForX[x] = null;
            });

            // 条件1: x=150, 250 の両方が G >= 200, B <= 10 を満たす最小 Y
            for (let y = 1650; y < newHeight; y++) {
                let meetsCondition = true; // 両方の x で条件を満たすか

                for (let x of xCoords) {
                    if (x >= newWidth) {
                        meetsCondition = false;
                        break;
                    }
                    const index = (y * newWidth + x) * 4;
                    const r = data[index];     // 赤
                    const g = data[index + 1]; // 緑
                    const b = data[index + 2]; // 青

                    // 条件: G >= 200, B <= 10
                    if (!(g >= 200 && b <= 10)) {
                        meetsCondition = false;
                        break;
                    }
                }

                if (meetsCondition) {
                    minCommonY = y;
                    break; // 最小の y が見つかったのでループを終了
                }
            }

            // 条件2: 各 x=218, 435, 650, 867 で R >= 200, G <= 100, B <= 100 を満たす最小 Y (1300以上)
            for (let y = 1300; y < newHeight; y++) {
                for (let x of xTargets) {
                    if (x >= newWidth) continue;

                    const index = (y * newWidth + x) * 4;
                    const r = data[index];     // 赤
                    const g = data[index + 1]; // 緑
                    const b = data[index + 2]; // 青

                    // 条件: R >= 200, G <= 100, B <= 100
                    if (r >= 200 && g <= 100 && b <= 100) {
                        if (minYForX[x] === null) {
                            minYForX[x] = y;
                        }
                    }
                }
            }

            // 各 x 座標で minCommonY との引き算を計算
            let resultsHTML = `<p>画像リサイズ後のサイズ: ${newWidth}x${newHeight}</p>`;
            resultsHTML += `<p>x=150, x=250 の両方で条件を満たす最小Y: ${minCommonY === null ? "条件を満たすピクセルなし" : minCommonY}</p>`;

            xTargets.forEach(x => {
                const yValue = minYForX[x] === null ? "条件を満たすピクセルなし" : minYForX[x];
                const diff = (minCommonY !== null && minYForX[x] !== null) ? (minCommonY - minYForX[x]) : "計算不可";
                resultsHTML += `<p>x=${x} の最小Y: ${yValue}</p>`;
                resultsHTML += `<p>Yの引き算 (minCommonY - minYForX[${x}]): ${diff}</p>`;
            });

            // 結果を画面に表示
            document.getElementById("result").innerHTML = resultsHTML;
        };

        img.src = reader.result;
    };

    reader.readAsDataURL(file);
});
