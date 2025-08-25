#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

/**
 * Translation mappings for common terms
 */
const translations = {
    // French translations
    fr: {
        // Document related
        "Upload again": "Télécharger à nouveau",
        Back: "Retour",
        "Back Side": "Côté arrière",
        "Document Scanning Instructions": "Instructions de numérisation de document",
        "Document Template": "Modèle de document",
        "Document Upload Instructions": "Instructions de téléchargement de document",
        "Driver License": "Permis de conduire",
        "Extracted Information": "Informations extraites",
        "Find file on your device": "Trouver le fichier sur votre appareil",
        Front: "Avant",
        "Front Side": "Côté avant",
        "ID Card": "Carte d'identité",
        ID: "ID",
        "The file must be in one of the following formats: .jpeg, .png, or .jpg":
            "Le fichier doit être dans l'un des formats suivants : .jpeg, .png ou .jpg",
        Instructions: "Instructions",
        "OCR Details from Back Side Document": "Détails OCR du document côté arrière",
        "OCR Details from Front Side Document": "Détails OCR du document côté avant",
        Passport: "Passeport",
        Platform: "Plateforme",
        "Process Information": "Informations sur le processus",
        "Scan Document": "Scanner le document",
        "Choose how you want to provide your document": "Choisissez comment vous voulez fournir votre document",
        "Select Country": "Sélectionner le pays",
        "Select Document Type": "Sélectionner le type de document",
        "Select Method": "Sélectionner la méthode",
        "Tax Information": "Informations fiscales",
        "Template ID": "ID du modèle",
        "Upload Back Side": "Télécharger le côté arrière",
        "Upload Document": "Télécharger le document",
        "Upload Front Side": "Télécharger le côté avant",
        "Image Captured!": "Image capturée !",

        // ID scanning related
        "Your document has already been uploaded": "Votre document a déjà été téléchargé",
        "This document appears to be from an unsupported country. Please try again with a different document.":
            "Ce document semble provenir d'un pays non pris en charge. Veuillez réessayer avec un document différent.",
        "This document appears to be the wrong type of document. Please try again with a different document.":
            "Ce document semble être du mauvais type. Veuillez réessayer avec un document différent.",
        "Is the text, photo, and all relative data clear, glare-free and not blurry? If you are happy with the result, upload the document for processing.":
            "Le texte, la photo et toutes les données relatives sont-ils clairs, sans reflets et non flous ? Si vous êtes satisfait du résultat, téléchargez le document pour traitement.",

        // Liveness related
        "Is the image free of blurring and center frame? If you are happy with the result, upload the image for processing.":
            "L'image est-elle exempte de flou et centrée dans le cadre ? Si vous êtes satisfait du résultat, téléchargez l'image pour traitement.",
    },

    // Portuguese translations
    br: {
        // Document related
        "Upload again": "Enviar novamente",
        Back: "Voltar",
        "Back Side": "Lado Posterior",
        "Document Scanning Instructions": "Instruções de Digitalização de Documento",
        "Document Template": "Modelo de Documento",
        "Document Upload Instructions": "Instruções de Upload de Documento",
        "Driver License": "Carteira de Motorista",
        "Extracted Information": "Informações Extraídas",
        "Find file on your device": "Encontrar arquivo no seu dispositivo",
        Front: "Frontal",
        "Front Side": "Lado Frontal",
        "ID Card": "Carteira de Identificação",
        ID: "ID",
        "The file must be in one of the following formats: .jpeg, .png, or .jpg":
            "O arquivo deve estar em um dos seguintes formatos: .jpeg, .png ou .jpg",
        Instructions: "Instruções",
        "OCR Details from Back Side Document": "Detalhes de OCR do Documento Posterior",
        "OCR Details from Front Side Document": "Detalhes de OCR do Documento Frontal",
        Passport: "Passaporte",
        Platform: "Plataforma",
        "Process Information": "Informação do Processo",
        "Scan Document": "Escanear Documento",
        "Choose how you want to provide your document": "Escolha como você deseja fornecer seu documento",
        "Select Country": "Selecionar País",
        "Select Document Type": "Selecionar Tipo de Documento",
        "Select Method": "Selecionar Método",
        "Tax Information": "Informação Fiscal",
        "Template ID": "ID do Modelo",
        "Upload Back Side": "Enviar Lado Posterior",
        "Upload Document": "Enviar Documento",
        "Upload Front Side": "Enviar Lado Frontal",
        "Image Captured!": "Imagem Capturada!",

        // ID scanning related
        "Your document has already been uploaded": "Seu documento já foi enviado",
        "This document appears to be from an unsupported country. Please try again with a different document.":
            "Este documento parece ser de um país não suportado. Por favor, tente novamente com um documento diferente.",
        "This document appears to be the wrong type of document. Please try again with a different document.":
            "Este documento parece ser do tipo incorreto. Por favor, tente novamente com um documento diferente.",
        "Is the text, photo, and all relative data clear, glare-free and not blurry? If you are happy with the result, upload the document for processing.":
            "O texto, foto e todos os dados relativos estão claros, sem reflexos e não borrados? Se você está satisfeito com o resultado, envie o documento para processamento.",

        // Liveness related
        "Is the image free of blurring and center frame? If you are happy with the result, upload the image for processing.":
            "A imagem está livre de borrão e centralizada no quadro? Se você está satisfeito com o resultado, envie a imagem para processamento.",
    },

    // Italian translations
    it: {
        // Document related
        "Upload again": "Carica di nuovo",
        Back: "Indietro",
        "Back Side": "Lato Posteriore",
        "Document Scanning Instructions": "Istruzioni per la Scansione del Documento",
        "Document Template": "Modello del Documento",
        "Document Upload Instructions": "Istruzioni per il Caricamento del Documento",
        "Driver License": "Patente di Guida",
        "Extracted Information": "Informazioni Estratte",
        "Find file on your device": "Trova il file sul tuo dispositivo",
        Front: "Fronte",
        "Front Side": "Lato Frontale",
        "ID Card": "Carta d'Identità",
        ID: "ID",
        "The file must be in one of the following formats: .jpeg, .png, or .jpg":
            "Il file deve essere in uno dei seguenti formati: .jpeg, .png o .jpg",
        Instructions: "Istruzioni",
        "OCR Details from Back Side Document": "Dettagli OCR dal Documento Lato Posteriore",
        "OCR Details from Front Side Document": "Dettagli OCR dal Documento Lato Frontale",
        Passport: "Passaporto",
        Platform: "Piattaforma",
        "Process Information": "Informazioni sul Processo",
        "Scan Document": "Scansiona Documento",
        "Choose how you want to provide your document": "Scegli come vuoi fornire il tuo documento",
        "Select Country": "Seleziona Paese",
        "Select Document Type": "Seleziona Tipo di Documento",
        "Select Method": "Seleziona Metodo",
        "Tax Information": "Informazioni Fiscali",
        "Template ID": "ID del Modello",
        "Upload Back Side": "Carica Lato Posteriore",
        "Upload Document": "Carica Documento",
        "Upload Front Side": "Carica Lato Frontale",
        "Image Captured!": "Immagine Catturata!",

        // ID scanning related
        "Your document has already been uploaded": "Il tuo documento è già stato caricato",
        "This document appears to be from an unsupported country. Please try again with a different document.":
            "Questo documento sembra provenire da un paese non supportato. Riprova con un documento diverso.",
        "This document appears to be the wrong type of document. Please try again with a different document.":
            "Questo documento sembra essere del tipo sbagliato. Riprova con un documento diverso.",
        "Is the text, photo, and all relative data clear, glare-free and not blurry? If you are happy with the result, upload the document for processing.":
            "Il testo, la foto e tutti i dati relativi sono chiari, privi di abbagliamento e non sfocati? Se sei soddisfatto del risultato, carica il documento per l'elaborazione.",

        // Liveness related
        "Is the image free of blurring and center frame? If you are happy with the result, upload the image for processing.":
            "L'immagine è priva di sfocatura e centrata nel frame? Se sei soddisfatto del risultato, carica l'immagine per l'elaborazione.",
    },

    // Chinese translations
    cn: {
        // Document related
        "Upload again": "重新上传",
        Back: "返回",
        "Back Side": "背面",
        "Document Scanning Instructions": "文档扫描说明",
        "Document Template": "文档模板",
        "Document Upload Instructions": "文档上传说明",
        "Driver License": "驾驶执照",
        "Extracted Information": "提取的信息",
        "Find file on your device": "在您的设备上查找文件",
        Front: "正面",
        "Front Side": "正面",
        "ID Card": "身份证",
        ID: "身份证",
        "The file must be in one of the following formats: .jpeg, .png, or .jpg": "文件必须是以下格式之一：.jpeg、.png 或 .jpg",
        Instructions: "说明",
        "OCR Details from Back Side Document": "文档背面OCR详情",
        "OCR Details from Front Side Document": "文档正面OCR详情",
        Passport: "护照",
        Platform: "平台",
        "Process Information": "处理信息",
        "Scan Document": "扫描文档",
        "Choose how you want to provide your document": "选择您想要提供文档的方式",
        "Select Country": "选择国家",
        "Select Document Type": "选择文档类型",
        "Select Method": "选择方法",
        "Tax Information": "税务信息",
        "Template ID": "模板ID",
        "Upload Back Side": "上传背面",
        "Upload Document": "上传文档",
        "Upload Front Side": "上传正面",
        "Image Captured!": "图像已捕获！",

        // ID scanning related
        "Your document has already been uploaded": "您的文档已经上传",
        "This document appears to be from an unsupported country. Please try again with a different document.":
            "此文档似乎来自不支持的国家。请尝试使用不同的文档。",
        "This document appears to be the wrong type of document. Please try again with a different document.":
            "此文档似乎是错误的文档类型。请尝试使用不同的文档。",
        "Is the text, photo, and all relative data clear, glare-free and not blurry? If you are happy with the result, upload the document for processing.":
            "文字、照片和所有相关数据是否清晰、无眩光且不模糊？如果您对结果满意，请上传文档进行处理。",

        // Liveness related
        "Is the image free of blurring and center frame? If you are happy with the result, upload the image for processing.":
            "图像是否无模糊且居中？如果您对结果满意，请上传图像进行处理。",
    },

    // Hindi translations
    in: {
        // Document related
        "Upload again": "फिर से अपलोड करें",
        Back: "वापस",
        "Back Side": "पिछला भाग",
        "Document Scanning Instructions": "दस्तावेज़ स्कैनिंग निर्देश",
        "Document Template": "दस्तावेज़ टेम्पलेट",
        "Document Upload Instructions": "दस्तावेज़ अपलोड निर्देश",
        "Driver License": "ड्राइवर लाइसेंस",
        "Extracted Information": "निकाली गई जानकारी",
        "Find file on your device": "अपने डिवाइस पर फ़ाइल खोजें",
        Front: "सामने",
        "Front Side": "सामने का भाग",
        "ID Card": "आईडी कार्ड",
        ID: "आईडी",
        "The file must be in one of the following formats: .jpeg, .png, or .jpg":
            "फ़ाइल निम्नलिखित प्रारूपों में से एक में होनी चाहिए: .jpeg, .png, या .jpg",
        Instructions: "निर्देश",
        "OCR Details from Back Side Document": "पिछले भाग के दस्तावेज़ से OCR विवरण",
        "OCR Details from Front Side Document": "सामने के भाग के दस्तावेज़ से OCR विवरण",
        Passport: "पासपोर्ट",
        Platform: "प्लेटफ़ॉर्म",
        "Process Information": "प्रक्रिया की जानकारी",
        "Scan Document": "दस्तावेज़ स्कैन करें",
        "Choose how you want to provide your document": "चुनें कि आप अपना दस्तावेज़ कैसे प्रदान करना चाहते हैं",
        "Select Country": "देश चुनें",
        "Select Document Type": "दस्तावेज़ का प्रकार चुनें",
        "Select Method": "विधि चुनें",
        "Tax Information": "कर की जानकारी",
        "Template ID": "टेम्पलेट आईडी",
        "Upload Back Side": "पिछला भाग अपलोड करें",
        "Upload Document": "दस्तावेज़ अपलोड करें",
        "Upload Front Side": "सामने का भाग अपलोड करें",
        "Image Captured!": "छवि कैप्चर की गई!",

        // ID scanning related
        "Your document has already been uploaded": "आपका दस्तावेज़ पहले से ही अपलोड किया गया है",
        "This document appears to be from an unsupported country. Please try again with a different document.":
            "यह दस्तावेज़ किसी असमर्थित देश से प्रतीत होता है। कृपया किसी अलग दस्तावेज़ के साथ फिर से प्रयास करें।",
        "This document appears to be the wrong type of document. Please try again with a different document.":
            "यह दस्तावेज़ गलत प्रकार का प्रतीत होता है। कृपया किसी अलग दस्तावेज़ के साथ फिर से प्रयास करें।",
        "Is the text, photo, and all relative data clear, glare-free and not blurry? If you are happy with the result, upload the document for processing.":
            "क्या पाठ, फ़ोटो और सभी संबंधित डेटा स्पष्ट, चमक-मुक्त और धुंधला नहीं है? यदि आप परिणाम से संतुष्ट हैं, तो प्रसंस्करण के लिए दस्तावेज़ अपलोड करें।",

        // Liveness related
        "Is the image free of blurring and center frame? If you are happy with the result, upload the image for processing.":
            "क्या छवि धुंधलापन से मुक्त है और फ्रेम में केंद्रित है? यदि आप परिणाम से संतुष्ट हैं, तो प्रसंस्करण के लिए छवि अपलोड करें।",
    },

    // Korean translations
    kr: {
        // Document related
        "Upload again": "다시 업로드",
        Back: "뒤로",
        "Back Side": "뒷면",
        "Document Scanning Instructions": "문서 스캔 지침",
        "Document Template": "문서 템플릿",
        "Document Upload Instructions": "문서 업로드 지침",
        "Driver License": "운전면허증",
        "Extracted Information": "추출된 정보",
        "Find file on your device": "기기에서 파일 찾기",
        Front: "앞면",
        "Front Side": "앞면",
        "ID Card": "신분증",
        ID: "신분증",
        "The file must be in one of the following formats: .jpeg, .png, or .jpg": "파일은 다음 형식 중 하나여야 합니다: .jpeg, .png 또는 .jpg",
        Instructions: "지침",
        "OCR Details from Back Side Document": "뒷면 문서의 OCR 세부사항",
        "OCR Details from Front Side Document": "앞면 문서의 OCR 세부사항",
        Passport: "여권",
        Platform: "플랫폼",
        "Process Information": "처리 정보",
        "Scan Document": "문서 스캔",
        "Choose how you want to provide your document": "문서를 제공하는 방법을 선택하세요",
        "Select Country": "국가 선택",
        "Select Document Type": "문서 유형 선택",
        "Select Method": "방법 선택",
        "Tax Information": "세금 정보",
        "Template ID": "템플릿 ID",
        "Upload Back Side": "뒷면 업로드",
        "Upload Document": "문서 업로드",
        "Upload Front Side": "앞면 업로드",
        "Image Captured!": "이미지가 캡처되었습니다!",

        // ID scanning related
        "Your document has already been uploaded": "문서가 이미 업로드되었습니다",
        "This document appears to be from an unsupported country. Please try again with a different document.":
            "이 문서는 지원되지 않는 국가에서 온 것 같습니다. 다른 문서로 다시 시도해 주세요.",
        "This document appears to be the wrong type of document. Please try again with a different document.":
            "이 문서는 잘못된 유형의 문서인 것 같습니다. 다른 문서로 다시 시도해 주세요.",
        "Is the text, photo, and all relative data clear, glare-free and not blurry? If you are happy with the result, upload the document for processing.":
            "텍스트, 사진 및 모든 관련 데이터가 명확하고, 눈부심이 없으며 흐릿하지 않습니까? 결과에 만족하시면 처리를 위해 문서를 업로드하세요.",

        // Liveness related
        "Is the image free of blurring and center frame? If you are happy with the result, upload the image for processing.":
            "이미지가 흐릿하지 않고 프레임 중앙에 있습니까? 결과에 만족하시면 처리를 위해 이미지를 업로드하세요.",
    },

    // Russian translations
    ru: {
        // Document related
        "Upload again": "Загрузить снова",
        Back: "Назад",
        "Back Side": "Обратная сторона",
        "Document Scanning Instructions": "Инструкции по сканированию документа",
        "Document Template": "Шаблон документа",
        "Document Upload Instructions": "Инструкции по загрузке документа",
        "Driver License": "Водительские права",
        "Extracted Information": "Извлеченная информация",
        "Find file on your device": "Найти файл на вашем устройстве",
        Front: "Лицевая сторона",
        "Front Side": "Лицевая сторона",
        "ID Card": "Удостоверение личности",
        ID: "Удостоверение личности",
        "The file must be in one of the following formats: .jpeg, .png, or .jpg":
            "Файл должен быть в одном из следующих форматов: .jpeg, .png или .jpg",
        Instructions: "Инструкции",
        "OCR Details from Back Side Document": "Детали OCR с обратной стороны документа",
        "OCR Details from Front Side Document": "Детали OCR с лицевой стороны документа",
        Passport: "Паспорт",
        Platform: "Платформа",
        "Process Information": "Информация о процессе",
        "Scan Document": "Сканировать документ",
        "Choose how you want to provide your document": "Выберите, как вы хотите предоставить документ",
        "Select Country": "Выберите страну",
        "Select Document Type": "Выберите тип документа",
        "Select Method": "Выберите метод",
        "Tax Information": "Налоговая информация",
        "Template ID": "ID шаблона",
        "Upload Back Side": "Загрузить обратную сторону",
        "Upload Document": "Загрузить документ",
        "Upload Front Side": "Загрузить лицевую сторону",
        "Image Captured!": "Изображение захвачено!",

        // ID scanning related
        "Your document has already been uploaded": "Ваш документ уже загружен",
        "This document appears to be from an unsupported country. Please try again with a different document.":
            "Этот документ, похоже, из неподдерживаемой страны. Пожалуйста, попробуйте снова с другим документом.",
        "This document appears to be the wrong type of document. Please try again with a different document.":
            "Этот документ, похоже, неправильного типа. Пожалуйста, попробуйте снова с другим документом.",
        "Is the text, photo, and all relative data clear, glare-free and not blurry? If you are happy with the result, upload the document for processing.":
            "Текст, фото и все относительные данные четкие, без бликов и не размытые? Если вы довольны результатом, загрузите документ для обработки.",

        // Liveness related
        "Is the image free of blurring and center frame? If you are happy with the result, upload the image for processing.":
            "Изображение без размытия и по центру кадра? Если вы довольны результатом, загрузите изображение для обработки.",
    },
};

/**
 * Translate placeholder text in a language file
 * @param {Object} langData - The language data object
 * @param {string} langCode - The language code (fr, br, it, etc.)
 * @returns {Object} Updated language data object
 */
function translatePlaceholders(langData, langCode) {
    const langTranslations = translations[langCode];
    if (!langTranslations) {
        return langData;
    }

    function translateValue(value) {
        if (typeof value === "string" && value.startsWith("[TO TRANSLATE] ")) {
            const englishText = value.substring(15); // Remove "[TO TRANSLATE] " prefix
            return langTranslations[englishText] || englishText; // Use translation or fallback to English
        }
        return value;
    }

    function translateObject(obj) {
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (typeof obj[key] === "object" && obj[key] !== null) {
                    translateObject(obj[key]);
                } else {
                    obj[key] = translateValue(obj[key]);
                }
            }
        }
    }

    translateObject(langData);
    return langData;
}

/**
 * Main function to translate all placeholder text
 */
function main() {
    const i18nDir = path.join(__dirname, "..", "src", "assets", "i18n");

    // Get all language files except English
    const languageFiles = fs
        .readdirSync(i18nDir)
        .filter((file) => file.endsWith(".json") && file !== "en.json")
        .map((file) => path.join(i18nDir, file));

    console.log(`🔍 Translating placeholder text in ${languageFiles.length} language files...\n`);

    languageFiles.forEach((langFile) => {
        const langCode = path.basename(langFile, ".json");
        const langName = langCode.toUpperCase();

        try {
            // Read the language file
            const langData = JSON.parse(fs.readFileSync(langFile, "utf8"));

            // Translate placeholders
            const translatedData = translatePlaceholders(langData, langCode);

            // Write the updated file
            fs.writeFileSync(langFile, JSON.stringify(translatedData, null, 4), "utf8");

            console.log(`✅ ${langName}: Placeholders translated successfully`);
        } catch (error) {
            console.error(`❌ Error processing ${langName}:`, error.message);
        }
    });

    console.log("\n🎉 Translation of placeholder text completed!");
    console.log("\n📝 Note: Some translations may still be in English if no specific translation was provided.");
    console.log("   You can add more translations to the translations object in this script.");
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = {
    translatePlaceholders,
    translations,
};
