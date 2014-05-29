<?php

    //The directory (relative to this file) that holds the images
    $dir = "ships";

    //This array will hold all the image addresses
    $result = array();

    //Get all the files in the specified directory
    $files = scandir($dir);


    foreach($files as $file) {

        switch(ltrim(strstr($file, '.'), '.')) {

            case "xml":
                $fileContents = file_get_contents($dir . "/" . $file);

                // Cleanup
                $fileContents = str_replace(array("\n", "\r", "\t"), '', $fileContents);
                $fileContents = trim(str_replace('"', "'", $fileContents));

                // XML
                //$simpleXml = 

                // Add Json
                $result[] = simplexml_load_string($fileContents);

        }
    }

    //Convert the array into JSON
    $resultJson = json_encode($result);

    //Output the JSON object
    //This is what the AJAX request will see
    echo($resultJson);

?>