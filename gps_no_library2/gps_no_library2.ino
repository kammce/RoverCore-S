#include <Wire.h>  // Comes with Arduino IDE

#include <string.h>

#include <cstring.h>

//#include <Adafruit_GPS.h>

#include <SoftwareSerial.h>

#include <LiquidCrystal_I2C.h>



/*-----( Declare Constants )-----*/

/*-----( Declare objects )-----*/

// set the LCD address to 0x27 for a 20 chars 4 line display

// Set the pins on the I2C chip used for LCD connections:

//                    addr, en,rw,rs,d4,d5,d6,d7,bl,blpol

LiquidCrystal_I2C lcd(0x27, 2, 1, 0, 4, 5, 6, 7, 3, POSITIVE);  // Set the LCD I2C address

SoftwareSerial mySerial(3, 2);





String inputString = "";         // a string to hold incoming data

boolean stringComplete = false;  // whether the string is complete





void setup()   /*----( SETUP: RUNS ONCE )----*/

{

  Serial.begin(38400);  // Used to type in characters

  inputString.reserve(200);

  lcd.begin(16,2);   // initialize the lcd for 16 chars 2 lines, turn on backlight

  lcd.backlight(); // finish with backlight on  





// Wait and then tell user they can start the Serial Monitor and type in characters to

// Display. (Set Serial Monitor option to "No Line Ending")

  lcd.clear();

  lcd.setCursor(0,0); //Start at character 0 on line 0

    mySerial.begin(9600);

  

  




  lcd.print("GPS test...");

//delay(200);

mySerial.write("$PMTK314,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0*29");  //RMC onnly

//delay(200);

  mySerial.write("$PMTK220,200*2C");          //5hz update
//delay(200);
  mySerial.write("$PMTK300,200,0,0,0,0*2F");  //    //5hz
//delay(200);
Serial.print("OKAY!\n");
delay(1000);



  /*

  delay(1000);

  lcd.clear();

  int x =0;

  do {

  lcd.setCursor(0,1); //Start at character 0 on line 0

  lcd.print("Inititalizing");

  delay(500);

  lcd.clear();

  lcd.setCursor(0,1);

  lcd.print("Inititalizing.");

  delay(500);

  lcd.clear();

  lcd.setCursor(0,1);

  lcd.print("Inititalizing..");

  delay(500);

  lcd.clear();

  lcd.setCursor(0,1);

  lcd.print("Inititalizing...");

  delay(1000);

  lcd.clear();

  x++;

  } while (x<2);

  */

}

void loop()                     // run over and over again

{

   if (mySerial.available()) {   

    // Serial.write(mySerial.read());    //read from gps

    // get the new byte:

    char inChar = (char)mySerial.read(); 

    // add it to the inputString:

    inputString += inChar;

    // if the incoming character is a newline, set a flag

    // so the main loop can do something about it:

    if (inChar == '\n') {

      stringComplete = true;

    }

  }

       if (stringComplete) {

         lcd.clear();             //clear lcd screen



    char * token;   // first token pointed to by strtok (format)
    char * token2; // second token pointed to by strtok (time)
    char * token3; // fix valid or not
    char * token4; // lat
    char * token5; // lat dir
    char * token6; // long
    char * token7; //long dir
    char * search = ",";

    //char * line = "hello,khalil";

    token = strtok((char*)inputString.c_str(), search); //token should point to "$GPRMC"
    token2 = strtok((char*)NULL, search); //Time?
    token3 = strtok((char*)NULL, search); //valid?
    token4 = strtok((char*)NULL, search); //lat
    token5 = strtok((char*)NULL, search); //lat dir
    token6 = strtok((char*)NULL, search); //long
    token7 = strtok((char*)NULL, search); //long dir
    

Serial.print(token);
Serial.print(", ");
Serial.print(token3);
Serial.print(" ");

    if ((strcmp(token,"$GPRMC") == 0) && (strcmp(token3,"A") == 0)) {
      Serial.print("Lat: ");
      Serial.print(token4);
      Serial.print(" ");
      Serial.print(token5);
      Serial.print(", ");
      Serial.print("Long: ");
      Serial.print(token6);
      Serial.print(" ");
      Serial.print(token7);
      
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("Lat:");
      lcd.print(token4);
      lcd.print(token5);
      lcd.setCursor(0,1);
      lcd.print("Lon:");
      lcd.print(token6);
      lcd.print(token7);
    }
    
    Serial.print("\n");

    //MSerial.print(strcmp (token,"$GPRMC"), DEC);

    if (strcmp(token,"$GPRMC") == 0){  //not yet working

      //lcd.print(token);

    }

    delay(1000);
    

   // lcd.print(inputString);      //print entire (unparsed) NMEA statement

    inputString = "";          // clear the string

    stringComplete = false;      //reset to incomplete

  }

  //if (Serial.available()) 
    //mySerial.write(Serial.read());    //write to gps

}
