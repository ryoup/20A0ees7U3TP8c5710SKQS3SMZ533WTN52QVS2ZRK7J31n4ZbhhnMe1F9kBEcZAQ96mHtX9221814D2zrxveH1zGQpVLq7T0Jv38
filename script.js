document.getElementById("uploadForm").addEventListener("submit", function(e) {
    e.preventDefault(); // ページリロードを防止

    console.log("✅ script.js が正常に読み込まれました");

    const fileInput = document.getElementById("fileInput");
    if (fileInput.files.length === 0) {
        alert("画像を選択してください！");
        return;
    }

    console.log(`📡 ${fileInput.files.length} 枚の画像を取得しました`);

    processAllImages(fileInput.files);
});

// 全画像を処理する関数
function processAllImages(files) {
    let resultsHTML = `<h2>解析結果</h2>`;
    let fileIndex = 0;

    function processNextImage() {
        if (fileIndex >= files.length) {
            document.getElementById("result").innerHTML = resultsHTML;
            return;
        }

        const file = files[fileIndex];
        console.log(`🖼️ 画像解析開始 (${fileIndex + 1}/${files.length}): ${file.name}`);

        processImage(file, (resultHTML) => {
            resultsHTML += `<h3>画像: ${file.name}</h3>${resultHTML}`;
            fileIndex++;
            processNextImage(); // 次の画像を処理
        });
    }

    processNextImage();
}

// 画像解析処理
function processImage(file, callback) {
    const reader = new FileReader();

    reader.onload = function() {
        const img = new Image();
        img.onload = function() {
            let newWidth = img.width;
            let newHeight = img.height;

            if (newWidth !== 1170) {
                const scaleFactor = 1170 / newWidth;
                newWidth = 1170;
                newHeight = Math.round(img.height * scaleFactor);
            }

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            canvas.width = newWidth;
            canvas.height = newHeight;
            ctx.drawImage(img, 0, 0, newWidth, newHeight);

            const imageData = ctx.getImageData(0, 0, newWidth, newHeight);
            const data = imageData.data;

            const targetX = 469; // x=435 の最小Yを取得
            let minYForX435 = null;

            for (let y = 1300; y < newHeight; y++) {
                if (targetX >= newWidth) continue;

                const index = (y * newWidth + targetX) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];

                if (r >= 220 && g <= 100 && b <= 100) {
                    minYForX435 = y;
                    break;
                }
            }

            if (minYForX435 !== null) {
                let validY = minYForX435;
                let foundValid = false;

                while (validY <= minYForX435 + 20 && validY < newHeight) {
                    let allValid = true;
                    for (let y = validY; y <= validY + 20 && y < newHeight; y++) {
                        const index = (y * newWidth + targetX) * 4;
                        const g = data[index + 1];
                        const b = data[index + 2];

                        if (g > 100 || b > 100) {
                            allValid = false;
                            break;
                        }
                    }
                    if (allValid) {
                        foundValid = true;
                        break;
                    }
                    validY++;
                }

                minYForX435 = foundValid ? validY : null;
            }

            let resultHTML = minYForX435 !== null
                ? `<p>x=469 の最小Y: ${minYForX435}</p>`
                : `<p>x=435 の最小Y: 条件を満たすピクセルなし</p>`;

            console.log("📊 結果のHTML:", resultHTML);
            callback(resultHTML);
        };

        img.src = reader.result;
    };

    reader.readAsDataURL(file);
}
