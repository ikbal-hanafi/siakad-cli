<?php

libxml_use_internal_errors(TRUE);

$COOKIEFILE = tempnam(sys_get_temp_dir(), 'kuki');
$CH         = curl_init();

curl_setopt_array($CH, [
   CURLOPT_COOKIEJAR => $COOKIEFILE,
   CURLOPT_COOKIESESSION => TRUE,
   CURLOPT_RETURNTRANSFER => TRUE,
   CURLOPT_FOLLOWLOCATION => TRUE,
   CURLOPT_HEADER => FALSE,
   CURLOPT_USERAGENT => 'Mozilla/5.0 (X11; U; Linux i686; es-VE;  rv:1.9.0.1)Gecko/2008071615 Debian/6.0 Firefox/9',
   CURLOPT_SSL_VERIFYPEER => FALSE,
   CURLOPT_SSL_VERIFYHOST=> FALSE,
]);


function fetch($url,$data=[]) {

   $ch = $GLOBALS['CH'];

   curl_setopt($ch, CURLOPT_URL, $url);

   if ( !empty($data) ){
      curl_setopt($ch, CURLOPT_COOKIEFILE, $GLOBALS['COOKIEFILE']);
      curl_setopt($ch, CURLOPT_POST, TRUE);
      curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
   }

   $res = curl_exec($ch);
   $dom = new DOMDocument();
   $dom->loadHTML($res);
   $xpath = new DOMXpath($dom);
   return $xpath;
}


function getPixel($source) {
 $image = imagecreatefromjpeg($source);
 $width = imagesx($image);
 $height = imagesy($image);

 for ($y = 0; $y < $height; $y++) {
    for ($x = 0; $x < $width; $x++) {
        $rgb = imagecolorat($image, $x, $y);
        $r = ($rgb >> 16) & 0xFF;
        $g = ($rgb >> 8) & 0xFF;
        $b = $rgb & 0xFF;
        if($r < 100)
           $x_array = array($r, $g, $b);
        else
           $x_array = array(255,255,255);
        $rgb = imagecolorallocate($image,...$x_array);
        imagesetpixel($image, $x, $y, $rgb);
    }
  }

  imagefilter($image, IMG_FILTER_GRAYSCALE);
  imagefilter($image, IMG_FILTER_CONTRAST, -100);
  return $image;
}

function getOcr($b64image){
   $ch = curl_init("https://api.ocr.space/parse/image");
   curl_setopt($ch, CURLOPT_HTTPHEADER, ["apikey: donotstealthiskey8589"]); //K84788486088957"]);
   curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
   curl_setopt($ch, CURLOPT_FOLLOWLOCATION, TRUE);
   curl_setopt($ch, CURLOPT_POST, TRUE);
   curl_setopt($ch, CURLOPT_POSTFIELDS, "base64Image=".urlencode("data:image/png;base64,$b64image"));
   $res = curl_exec($ch);
   return json_decode($res)->ParsedResults[0]->ParsedText;
}

function login($usr, $pwd){
   while (TRUE) {
      $res  = fetch('https://siakad.unsulbar.ac.id/login');
      $form = $res->query('//form[@action]')->item(0);

      $data = array();

      foreach($res->query('//input', $form) as $inp)
         $data[
                  $inp->getAttribute('name')
         ] = $inp->getAttribute('value');

      $imgChp = $res->query('//img[@id="Imageid"]', $form)->item(0);
      if (!isset($imgChp))
         continue;
      $imgChpSrc = $imgChp->getAttribute('src');

      ob_start();
      imagepng(getPixel($imgChpSrc));
      $b64 = base64_encode(ob_get_clean());

      $chapta=trim(str_replace(" ","",strtoupper(getOcr($b64))));
      echo $chapta.PHP_EOL;
      if( strlen($chapta) == 8 ){
         $data["captcha"] = $chapta;
         $data["user"]    = $usr;
         $data["pwd"]     = $pwd;

         $res = fetch($form->getAttribute("action"),$data);
         if(!preg_match('/logout/i', $res->query('//body')->item(0)->nodeValue, $_))
            continue;
      } else continue;

      $user = $res->query("//div[@class='d-sm-none d-lg-inline-block']")->item(0);
      if(isset($user)){
         echo $user->nodeValue;
         echo $res->query("//a/text()[contains(., 'Kelas')]")->item(0)->getAttribute('href');
      }
      break;
   }
}

login('D0121505','D0121505');