<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require "../vendor/autoload.php";

// === CONFIGURATION ===
$toEmail = "nanofly.works@gmail.com"; // Where to send the message
$recaptchaSecret = "6Lcoa0crAAAAAB08trESKI4U77XdgzhvxvVhJR0B"; // Replace with your Google reCAPTCHA secret key

// === HELPER: Validate reCAPTCHA ===
function validateRecaptcha($recaptchaResponse, $secretKey) {
    if (empty($recaptchaResponse)) return false;
    $verifyURL = "https://www.google.com/recaptcha/api/siteverify";
    $response = file_get_contents($verifyURL . "?secret=" . urlencode($secretKey) . "&response=" . urlencode($recaptchaResponse));
    $responseKeys = json_decode($response, true);
    return $responseKeys["success"] ?? false;
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // === Sanitize and Validate Inputs ===
    $userName    = htmlspecialchars(trim($_POST["name"] ?? ""));
    $userEmail   = filter_var($_POST["email"] ?? "", FILTER_VALIDATE_EMAIL);
    $subject     = htmlspecialchars(trim($_POST["subject"] ?? ""));
    $userMessage = htmlspecialchars(trim($_POST["message"] ?? ""));
    $recaptcha   = $_POST["g-recaptcha-response"] ?? "";

    // === Validate required fields ===
    if (!$userName || !$userEmail || !$subject || !$userMessage) {
        echo "All fields are required.";
        exit;
    }
    if (!$userEmail) {
        echo "Invalid email format.";
        exit;
    }
    // === Validate reCAPTCHA ===
    if (!validateRecaptcha($recaptcha, $recaptchaSecret)) {
        echo "reCAPTCHA verification failed. Please try again.";
        exit;
    }

    // === Send Email with PHPMailer ===
    $mail = new PHPMailer(true);
  
    try {
        // SMTP Server settings
        $mail -> SMTPDebug=0;
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'nanofly.works@gmail.com';      // Your Gmail
        $mail->Password   = 'qfbl ujve mwpz mbxo';         // Gmail App Password
        $mail->SMTPSecure = 'tls';
        $mail->Port       = 587;

        // Email settings
        $mail->setFrom($userEmail, $userName);
        $mail->addAddress($toEmail);

        $mail->Subject = $subject;
        $mail->Body    = "Name: $userName\nEmail: $userEmail\nSubject:$subject\nMessage:\n$userMessage";

        $mail->send();
        echo "success";
    } catch (Exception $e) {
        echo "Failed to send your message. Mailer Error: {$mail->ErrorInfo}";
    }
} else {
    echo "Invalid request method.";
}
