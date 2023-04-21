export const config = {
 
}

export const setConfig = (FaceTecSDK): void => {
  const sdkImageDirectory = "/assets/core/images/";

  FaceTecSDK.setResourceDirectory('/assets/core/sdk/resources');
  FaceTecSDK.setImagesDirectory(sdkImageDirectory);

  // For Color Customization
  const outerBackgroundColor = "#f9f9ff";
  const frameColor = "#f9f9ff";
  const borderColor = "#e5ebfd";
  const ovalColor = "#1a4ae9";
  const dualSpinnerColor = "#00ffe0";
  const textColor = "#01236d";
  const buttonAndFeedbackBarColor = "#01236b";
  const buttonAndFeedbackBarTextColor = "#f9f9ff";
  const buttonColorHighlight = "#396E99";
  const buttonColorDisabled = "#335eec";

  // For Frame Corner Radius Customization
  let frameCornerRadius = "10px";

  // For Cancel Button Customization
  const cancelButtonImage = sdkImageDirectory + "FaceTec_cancel.png";
  const cancelButtonLocation = FaceTecSDK.FaceTecCancelButtonLocation.TopLeft;

  // For image Customization
  const yourAppLogoImage = sdkImageDirectory + "FaceTec_your_app_logo.png";
  const securityWatermarkImage = FaceTecSDK.FaceTecSecurityWatermarkImage.FaceTec_ZoOm;


  // Set a default customization
  const defaultCustomization = new FaceTecSDK.FaceTecCustomization();


  // Set Frame Customization
  defaultCustomization.frameCustomization.borderCornerRadius = frameCornerRadius;
  defaultCustomization.frameCustomization.backgroundColor = frameColor;
  defaultCustomization.frameCustomization.borderColor = borderColor;

  // Set Overlay Customization
  defaultCustomization.overlayCustomization.brandingImage = yourAppLogoImage;
  defaultCustomization.overlayCustomization.backgroundColor = outerBackgroundColor;

  // Set Guidance Customization
  defaultCustomization.guidanceCustomization.backgroundColors = frameColor;
  defaultCustomization.guidanceCustomization.foregroundColor = textColor;
  defaultCustomization.guidanceCustomization.buttonBackgroundNormalColor = buttonAndFeedbackBarColor;
  defaultCustomization.guidanceCustomization.buttonBackgroundDisabledColor = buttonColorDisabled;
  defaultCustomization.guidanceCustomization.buttonBackgroundHighlightColor = buttonColorHighlight;
  defaultCustomization.guidanceCustomization.buttonTextNormalColor = buttonAndFeedbackBarTextColor;
  defaultCustomization.guidanceCustomization.buttonTextDisabledColor = buttonAndFeedbackBarTextColor;
  defaultCustomization.guidanceCustomization.buttonTextHighlightColor = buttonAndFeedbackBarTextColor;
  defaultCustomization.guidanceCustomization.retryScreenImageBorderColor = borderColor;
  defaultCustomization.guidanceCustomization.retryScreenOvalStrokeColor = borderColor;

  // Set Oval Customization
  defaultCustomization.ovalCustomization.strokeColor = ovalColor;
  defaultCustomization.ovalCustomization.progressColor1 = dualSpinnerColor;
  defaultCustomization.ovalCustomization.progressColor2 = dualSpinnerColor;

  // Set Feedback Customization
  defaultCustomization.feedbackCustomization.backgroundColor = buttonAndFeedbackBarColor;
  defaultCustomization.feedbackCustomization.textColor = buttonAndFeedbackBarTextColor;

  // Set Cancel Customization
  defaultCustomization.cancelButtonCustomization.customImage = cancelButtonImage;
  defaultCustomization.cancelButtonCustomization.location = cancelButtonLocation;

  // Set Security Watermark Customization
  defaultCustomization.securityWatermarkCustomization.setSecurityWatermarkImage(securityWatermarkImage);

  // Set Result Screen Customization
  defaultCustomization.resultScreenCustomization.backgroundColors = frameColor;
  defaultCustomization.resultScreenCustomization.foregroundColor = textColor;
  defaultCustomization.resultScreenCustomization.activityIndicatorColor = buttonAndFeedbackBarColor;
  defaultCustomization.resultScreenCustomization.resultAnimationBackgroundColor = buttonAndFeedbackBarColor;
  defaultCustomization.resultScreenCustomization.resultAnimationForegroundColor = buttonAndFeedbackBarTextColor;
  defaultCustomization.resultScreenCustomization.uploadProgressFillColor = buttonAndFeedbackBarColor;

  // Set ID Scan Customization
  defaultCustomization.idScanCustomization.selectionScreenBackgroundColors = frameColor;
  defaultCustomization.idScanCustomization.selectionScreenForegroundColor = textColor;
  defaultCustomization.idScanCustomization.reviewScreenBackgroundColors = frameColor;
  defaultCustomization.idScanCustomization.reviewScreenForegroundColor = buttonAndFeedbackBarTextColor;
  defaultCustomization.idScanCustomization.reviewScreenTextBackgroundColor = buttonAndFeedbackBarColor;
  defaultCustomization.idScanCustomization.captureScreenForegroundColor = buttonAndFeedbackBarTextColor;
  defaultCustomization.idScanCustomization.captureScreenTextBackgroundColor = buttonAndFeedbackBarColor;
  defaultCustomization.idScanCustomization.buttonBackgroundNormalColor = buttonAndFeedbackBarColor;
  defaultCustomization.idScanCustomization.buttonBackgroundDisabledColor = buttonColorDisabled;
  defaultCustomization.idScanCustomization.buttonBackgroundHighlightColor = buttonColorHighlight;
  defaultCustomization.idScanCustomization.buttonTextNormalColor = buttonAndFeedbackBarTextColor;
  defaultCustomization.idScanCustomization.buttonTextDisabledColor = buttonAndFeedbackBarTextColor;
  defaultCustomization.idScanCustomization.buttonTextHighlightColor = buttonAndFeedbackBarTextColor;
  defaultCustomization.idScanCustomization.captureScreenBackgroundColor = frameColor;
  defaultCustomization.idScanCustomization.captureFrameStrokeColor = borderColor;

  // Set Initial Loading Customization
  defaultCustomization.initialLoadingAnimationCustomization.backgroundColor = buttonAndFeedbackBarTextColor;
  defaultCustomization.initialLoadingAnimationCustomization.foregroundColor = buttonAndFeedbackBarColor;

  FaceTecSDK.setCustomization(defaultCustomization)
  return;
};

export const languages = {
  es: {
    "FaceTec_action_ok": "ACEPTAR",
    "FaceTec_action_im_ready": "ESTOY LISTO",
    "FaceTec_action_try_again": "VOLVER A INTENTARLO",
    "FaceTec_action_continue": "CONTINUAR",
    "FaceTec_action_take_photo": "TOMAR FOTO",
    "FaceTec_action_accept_photo": "ACEPTAR",
    "FaceTec_action_retake_photo": "VOLVER A TOMAR",
    "FaceTec_action_confirm": "CONFIRMAR INFORMACIÓN",

    "FaceTec_accessibility_cancel_button": "Cancelar",
    "FaceTec_accessibility_tap_guidance": "Toque dos veces cualquier parte de la pantalla para ver indicaciones sobre cómo alinear el rostro.",
    "FaceTec_accessibility_key_down_guidance": "Presione Entrar o la barra espaciadora para obtener orientación sobre la alineación de la cara",

    "FaceTec_accessibility_feedback_move_phone_away": "Su rostro está demasiado cerca",
    "FaceTec_accessibility_feedback_move_phone_closer": "Su rostro está demasiado lejos",
    "FaceTec_accessibility_feedback_face_too_far_left": "Su rostro está demasiado a la izquierda",
    "FaceTec_accessibility_feedback_face_too_far_right": "Su rostro está demasiado a la derecha",
    "FaceTec_accessibility_feedback_face_too_low": "Su rostro está demasiado abajo",
    "FaceTec_accessibility_feedback_face_too_high": "Su rostro está demasiado arriba",
    "FaceTec_accessibility_feedback_face_rotated_too_far_left": "Su rostro gira demasiado a la izquierda",
    "FaceTec_accessibility_feedback_face_rotated_too_far_right": "Su rostro gira demasiado a la derecha",
    "FaceTec_accessibility_feedback_face_looking_too_far_left": "Su rostro está demasiado inclinado hacia la izquierda",
    "FaceTec_accessibility_feedback_face_looking_too_far_right": "Su rostro está demasiado inclinado hacia la derecha",
    "FaceTec_accessibility_feedback_face_not_in_camera": "El rostro no se ve en la cámara",
    "FaceTec_accessibility_feedback_hold_phone_to_eye_level": "Mantenga el dispositivo a la altura de los ojos",
    "FaceTec_accessibility_feedback_move_away_web": "Cámara demasiado cerca",
    "FaceTec_accessibility_feedback_move_closer_web": "Cámara demasiado lejos",
    "FaceTec_accessibility_feedback_hold_to_eye_level_web": "Mover la cámara al nivel de los ojos",

    "FaceTec_presession_frame_your_face": "Encuadre su rostro en el óvalo",
    "FaceTec_presession_look_straight_ahead": "Mire hacia el frente",
    "FaceTec_presession_hold_steady3": "Manténgase quieto durante: 3",
    "FaceTec_presession_hold_steady2": "Manténgase quieto durante: 2",
    "FaceTec_presession_hold_steady1": "Manténgase quieto durante: 1",
    "FaceTec_presession_eyes_straight_ahead": "Mire hacia el frente",
    "FaceTec_presession_remove_dark_glasses": "Quítese los lentes oscuros",
    "FaceTec_presession_neutral_expression": "Expresión neutra, sin sonreír",
    "FaceTec_presession_conditions_too_bright": "Demasiada luz",
    "FaceTec_presession_brighten_your_environment": "Ilumine su entorno",

    "FaceTec_feedback_center_face": "Centre su rostro",
    "FaceTec_feedback_face_not_found": "Encuadre su rostro",
    "FaceTec_feedback_move_phone_away": "Apártese",
    "FaceTec_feedback_move_away_web": "Apártese",
    "FaceTec_feedback_move_phone_closer": "Acérquese",
    "FaceTec_feedback_move_web_closer": "Acerca la cara y rellena el óvalo",
    "FaceTec_feedback_move_web_even_closer": "Aún Más Cerca",
    "FaceTec_feedback_move_phone_to_eye_level": "Coloque la cámara a la altura de los ojos",
    "FaceTec_feedback_move_to_eye_level_web": "Mira Directamente A La Cámara",
    "FaceTec_feedback_face_not_looking_straight_ahead": "Mire hacia el frente",
    "FaceTec_feedback_face_not_upright": "Mantenga la cabeza recta",
    "FaceTec_feedback_face_not_upright_mobile": "Mantenga la cabeza recta",
    "FaceTec_feedback_hold_steady": "Quédese quieto",
    "FaceTec_feedback_use_even_lighting": "Ilumine el rostro de forma más uniforme",

    "FaceTec_instructions_header_ready_desktop": "Prepárese para su videoselfie",
    "FaceTec_instructions_header_ready_1_mobile": "Prepárese para",
    "FaceTec_instructions_header_ready_2_mobile": "su videoselfie",
    "FaceTec_instructions_message_ready_desktop": "Encuadre su rostro en el óvalo, Presione \"Estoy listo\" y acérquese",
    "FaceTec_instructions_message_ready_1_mobile": "Encuadre su rostro en el óvalo",
    "FaceTec_instructions_message_ready_2_mobile": "Presione \"Estoy listo\" y acérquese",

    "FaceTec_retry_header": "Intentémoslo otra vez",
    "FaceTec_retry_subheader_message": "Necesitamos una videoselfie más nítida",
    "FaceTec_retry_your_image_label": "Su selfie",
    "FaceTec_retry_ideal_image_label": "Pose ideal",
    "FaceTec_retry_instruction_message_1": "Sin reflejos ni luces intensas",
    "FaceTec_retry_instruction_message_2": "Expresión neutra, sin sonreír",
    "FaceTec_retry_instruction_message_3": "Demasiado borrosa, limpie la cámara",

    "FaceTec_camera_feed_issue_header": "Problema al proteger la conexión de la cámara",
    "FaceTec_camera_feed_issue_header_mobile": "Problema al proteger<br/>la conexión de la cámara",
    "FaceTec_camera_feed_issue_subheader_message_mobile": "Esta aplicación bloquea configuraciones de cámara web sospechosas.<br/><a href='https://livenesscheckhelp.com/' target='_blank' style='text-decoration:underline; pointer-events:all;'>Aprende más aquí.</a>.",
    "FaceTec_camera_feed_issue_subheader_message": "Este sistema no se puede verificar debido a lo siguiente:",
    "FaceTec_camera_feed_issue_table_header_1": "Posible Problema",
    "FaceTec_camera_feed_issue_table_header_2": "Corregir",
    "FaceTec_camera_feed_issue_table_row_1_cell_1_firefox_permissions_error": "Permisos de cámara no recordados en Firefox.",
    "FaceTec_camera_feed_issue_table_row_1_cell_2_firefox_permissions_error": "Marque Recordar Permisos.",
    "FaceTec_camera_feed_issue_table_row_1_cell_1": "Cámara ya en uso por otra aplicación.",
    "FaceTec_camera_feed_issue_table_row_1_cell_2": "Cierra la otra aplicación.",
    "FaceTec_camera_feed_issue_table_row_2_cell_1": "Una aplicación 3rd-Party está modificando el video.",
    "FaceTec_camera_feed_issue_table_row_2_cell_2": "Cierre / desinstale la otra aplicación.",
    "FaceTec_camera_feed_issue_table_row_3_cell_1": "Equipos que no pueden ser protegidos.",
    "FaceTec_camera_feed_issue_table_row_3_cell_2": "Usa un dispositivo diferente.",
    "FaceTec_camera_feed_issue_subtable_message": "Esta aplicación bloquea configuraciones de cámara web sospechosas. <a href='https://livenesscheckhelp.com/' target='_blank' style='text-decoration:underline; pointer-events:all;'>Aprende más aquí.</a>.",
    "FaceTec_camera_feed_issue_action": "VOLVER A INTENTARLO",
    "FaceTec_camera_feed_issue_action_firefox_permissions_error": "ACEPTAR",

    "FaceTec_camera_permission_header": "Habilite la cámara",
    "FaceTec_camera_permission_message": "Permisos de cámara deshabilitados.<br/>Verifique la configuración de su sistema operativo y navegador",

    "FaceTec_enter_fullscreen_header": "Modo Selfie a Pantalla Completa",
    "FaceTec_enter_fullscreen_message": "Antes de comenzar, haga clic en el botón de abajo para abrir el modo de pantalla completa.",
    "FaceTec_enter_fullscreen_action": "ABRIR PANTALLA COMPLETA",

    "FaceTec_initializing_camera": "Protegiendo la conexión de la cámara",

    "FaceTec_idscan_type_selection_header": "Prepárese para escanear<br/>su identificación",
    "FaceTec_idscan_capture_id_front_instruction_message": "Muestre el anverso de su identificación",
    "FaceTec_idscan_capture_id_back_instruction_message": "Muestre el reverso de su identificación",
    "FaceTec_idscan_review_id_front_instruction_message": "Verifique que la foto sea nítida y legible",
    "FaceTec_idscan_review_id_back_instruction_message": "Verifique que la foto sea nítida y legible",
    "FaceTec_idscan_additional_review_message": "Se requiere<br/>una verificación adicional",
    "FaceTec_idscan_ocr_confirmation_main_header": "Revisar y confirmar",
    "FaceTec_idscan_ocr_confirmation_scroll_message": "Desplácese hacia abajo",

    "FaceTec_result_success_message": "Listo",
    "FaceTec_result_facescan_upload_message": "Subiendo<br/>el escaneo facial 3D<br/>encriptado",
    "FaceTec_result_idscan_upload_message": "Subiendo<br/>el escaneo de identificación<br/>encriptado",
    "FaceTec_result_idscan_unsuccess_message": "La foto de la identificación<br/>o coincide con\el rostro del usuario",
    "FaceTec_result_idscan_success_front_side_message": "Escaneo de identificación completado",
    "FaceTec_result_idscan_success_front_side_back_next_message": "Anverso de la identificación<br/>escaneado",
    "FaceTec_result_idscan_success_back_side_message": "Escaneo de identificación completado",
    "FaceTec_result_idscan_success_passport_message": "Escaneo de pasaporte completado",
    "FaceTec_result_idscan_success_user_confirmation_message": "Escaneo de identificación con fotografía<br/>completado",
    "FaceTec_result_idscan_success_additional_review_message": "Captura de la fotografía de identificación<br/>completada",
    "FaceTec_result_idscan_retry_face_did_not_match_message": "El rostro no coincide<br/>lo suficiente",
    "FaceTec_result_idscan_retry_id_not_fully_visible_message": "La identificación<br/>no es totalmente visible",
    "FaceTec_result_idscan_retry_ocr_results_not_good_enough_message": "El texto de la identificación no es legible",
    "FaceTec_result_idscan_retry_id_type_not_suppported_message": "No se admite este tipo de identificación<br/>Utilice una identificación diferente",
    "FaceTec_result_idscan_retry_barcode_not_read_message": "No se pudo escanear el código de barras<br/>Inténtelo de nuevo",
  },
  en:{
    "FaceTec_action_ok": "OK",
    "FaceTec_action_im_ready": "I'M READY",
    "FaceTec_action_try_again": "TRY AGAIN",
    "FaceTec_action_continue": "CONTINUE",
    "FaceTec_action_take_photo": "TAKE PHOTO",
    "FaceTec_action_accept_photo": "ACCEPT",
    "FaceTec_action_retake_photo": "RETAKE",
    "FaceTec_action_confirm": "CONFIRM INFO",
  
    "FaceTec_accessibility_cancel_button": "Cancel",
    "FaceTec_accessibility_tap_guidance": "Double tap on the screen for face alignment guidance",
    "FaceTec_accessibility_key_down_guidance": "Press Enter or Spacebar for face alignment guidance",
  
    "FaceTec_accessibility_feedback_move_phone_away": "Camera Too Close",
    "FaceTec_accessibility_feedback_move_phone_closer": "Camera Too Far Away",
    "FaceTec_accessibility_feedback_face_too_far_left": "Face Too Far Left",
    "FaceTec_accessibility_feedback_face_too_far_right": "Face Too Far Right",
    "FaceTec_accessibility_feedback_face_too_low": "Face Too Low",
    "FaceTec_accessibility_feedback_face_too_high": "Face Too High",
    "FaceTec_accessibility_feedback_face_rotated_too_far_left": "Face Rotated Too Far Left",
    "FaceTec_accessibility_feedback_face_rotated_too_far_right": "Face Rotated Too Far Right",
    "FaceTec_accessibility_feedback_face_looking_too_far_left": "Face Pointing Too Far Left",
    "FaceTec_accessibility_feedback_face_looking_too_far_right": "Face Pointing Too Far Right",
    "FaceTec_accessibility_feedback_face_not_in_camera": "Face Not On Camera",
    "FaceTec_accessibility_feedback_hold_phone_to_eye_level": "Hold Device At Eye Level",
    "FaceTec_accessibility_feedback_move_away_web": "Camera Too Close",
    "FaceTec_accessibility_feedback_move_closer_web": "Camera Too Far Away",
    "FaceTec_accessibility_feedback_hold_to_eye_level_web": "Move Camera To Eye Level",
  
    "FaceTec_presession_frame_your_face": "Frame Your Face In The Oval",
    "FaceTec_presession_look_straight_ahead": "Look Straight Ahead",
    "FaceTec_presession_hold_steady3": "Hold Steady for: 3",
    "FaceTec_presession_hold_steady2": "Hold Steady for: 2",
    "FaceTec_presession_hold_steady1": "Hold Steady for: 1",
    "FaceTec_presession_eyes_straight_ahead": "Look Straight Ahead",
    "FaceTec_presession_remove_dark_glasses": "Remove Dark Glasses",
    "FaceTec_presession_neutral_expression": "Neutral Expression, No Smiling",
    "FaceTec_presession_conditions_too_bright": "Conditions Too Bright",
    "FaceTec_presession_brighten_your_environment": "Brighten Your Environment",
  
    "FaceTec_feedback_center_face": "Center Your Face",
    "FaceTec_feedback_face_not_found": "Frame Your Face",
    "FaceTec_feedback_move_phone_away": "Move Away",
    "FaceTec_feedback_move_away_web": "Move Away",
    "FaceTec_feedback_move_phone_closer": "Move Closer",
    "FaceTec_feedback_move_web_closer": "Move Face Closer & Fill Oval",
    "FaceTec_feedback_move_web_even_closer": "Even Closer",
    "FaceTec_feedback_move_phone_to_eye_level": "Move Phone To Eye Level",
    "FaceTec_feedback_move_to_eye_level_web": "Look Straight Into Camera",
    "FaceTec_feedback_face_not_looking_straight_ahead": "Look Straight Ahead",
    "FaceTec_feedback_face_not_upright": "Hold Your Head Straight",
    "FaceTec_feedback_face_not_upright_mobile": "Keep Head Straight",
    "FaceTec_feedback_hold_steady": "Hold Steady",
    "FaceTec_feedback_use_even_lighting": "Light Face More Evenly",
  
    "FaceTec_instructions_header_ready_desktop": "Get Ready For Your Video Selfie",
    "FaceTec_instructions_header_ready_1_mobile": "Get Ready For",
    "FaceTec_instructions_header_ready_2_mobile": "Your Video Selfie",
    "FaceTec_instructions_message_ready_desktop": "Frame Your Face in the Oval, Press I'm Ready & Move Closer",
    "FaceTec_instructions_message_ready_1_mobile": "Frame Your Face in the Oval,",
    "FaceTec_instructions_message_ready_2_mobile": "Press I'm Ready & Move Closer",
  
    "FaceTec_retry_header": "Let's Try That Again",
    "FaceTec_retry_subheader_message": "We Need a Clearer Video Selfie",
    "FaceTec_retry_your_image_label": "Your Selfie",
    "FaceTec_retry_ideal_image_label": "Ideal Pose",
    "FaceTec_retry_instruction_message_1": "No Glare or Extreme Lighting",
    "FaceTec_retry_instruction_message_2": "Neutral Expression, No Smiling",
    "FaceTec_retry_instruction_message_3": "Too Blurry, Clean Camera",
  
    "FaceTec_camera_feed_issue_header": "Issue Securing Camera Feed",
    "FaceTec_camera_feed_issue_header_mobile": "Issue Securing<br/>Camera Feed",
    "FaceTec_camera_feed_issue_subheader_message_mobile": "This App blocks suspicious webcam configurations.<br/><a href='https://livenesscheckhelp.com/' target='_blank' style='text-decoration:underline; pointer-events:all;'>Learn More Here</a>.",
    "FaceTec_camera_feed_issue_subheader_message": "This system cannot be verified due to the following:",
    "FaceTec_camera_feed_issue_table_header_1": "Possible Issue",
    "FaceTec_camera_feed_issue_table_header_2": "Fix",
    "FaceTec_camera_feed_issue_table_row_1_cell_1_firefox_permissions_error": "Camera permissions not remembered in Firefox.",
    "FaceTec_camera_feed_issue_table_row_1_cell_2_firefox_permissions_error": "Check Remember Permissions.",
    "FaceTec_camera_feed_issue_table_row_1_cell_1": "Camera already in use by another App.",
    "FaceTec_camera_feed_issue_table_row_1_cell_2": "Close the other App.",
    "FaceTec_camera_feed_issue_table_row_2_cell_1": "A 3rd-Party App is modifying the video.",
    "FaceTec_camera_feed_issue_table_row_2_cell_2": "Close/Uninstall the other App.",
    "FaceTec_camera_feed_issue_table_row_3_cell_1": "Hardware not capable of being secured.",
    "FaceTec_camera_feed_issue_table_row_3_cell_2": "Use a different Device.",
    "FaceTec_camera_feed_issue_subtable_message": "This App blocks suspicious webcam configurations. <a href='https://livenesscheckhelp.com/' target='_blank' style='text-decoration:underline; pointer-events:all;'>Learn More Here</a>.",
    "FaceTec_camera_feed_issue_action": "TRY AGAIN ANYWAY",
    "FaceTec_camera_feed_issue_action_firefox_permissions_error": "OK",
  
    "FaceTec_camera_permission_header": "Enable Camera",
    "FaceTec_camera_permission_message": "Camera permissions disabled.<br/>Please check your operating system and browser settings.",
  
    "FaceTec_enter_fullscreen_header": "Full Screen Selfie Mode",
    "FaceTec_enter_fullscreen_message": "Before we begin, please click the button below to open full screen mode.",
    "FaceTec_enter_fullscreen_action": "OPEN FULL SCREEN",
  
    "FaceTec_initializing_camera": "Securing Camera Feed",
  
    "FaceTec_idscan_type_selection_header": "Prepare to Scan<br/>Your ID Document",
    "FaceTec_idscan_capture_id_front_instruction_message": "Show Front of ID",
    "FaceTec_idscan_capture_id_back_instruction_message": "Show Back of ID",
    "FaceTec_idscan_review_id_front_instruction_message": "Confirm Photo is Clear & Legible",
    "FaceTec_idscan_review_id_back_instruction_message": "Confirm Photo is Clear & Legible",
    "FaceTec_idscan_additional_review_message": "Additional Review<br/>Required",
    "FaceTec_idscan_ocr_confirmation_main_header": "Review & Confirm",
    "FaceTec_idscan_ocr_confirmation_scroll_message": "Scroll Down",
  
    "FaceTec_result_success_message": "Success!",
    "FaceTec_result_facescan_upload_message": "Uploading<br/>Encrypted<br/>3D FaceScan",
    "FaceTec_result_idscan_upload_message": "Uploading<br/>Encrypted<br/>ID Document",
    "FaceTec_result_idscan_unsuccess_message": "ID Photo<br/>Did Not Match<br/>User's Face",
    "FaceTec_result_idscan_success_front_side_message": "ID Scan Complete",
    "FaceTec_result_idscan_success_front_side_back_next_message": "Front of ID<br/>Scanned",
    "FaceTec_result_idscan_success_back_side_message": "ID Scan Complete",
    "FaceTec_result_idscan_success_passport_message": "Passport Scan Complete",
    "FaceTec_result_idscan_success_user_confirmation_message": "Photo ID Scan<br/>Complete",
    "FaceTec_result_idscan_success_additional_review_message": "ID Photo Capture<br/>Complete",
    "FaceTec_result_idscan_retry_face_did_not_match_message": "Face Didn't Match<br/>Highly Enough",
    "FaceTec_result_idscan_retry_id_not_fully_visible_message": "ID Document<br/>Not Fully Visible",
    "FaceTec_result_idscan_retry_ocr_results_not_good_enough_message": "ID Text Not Legible",
    "FaceTec_result_idscan_retry_id_type_not_suppported_message": "ID Type Not Supported<br/>Please Use a Different ID",
    "FaceTec_result_idscan_retry_barcode_not_read_message": "Barcode Failed To Scan<br/>Please Try Again",
  }
}