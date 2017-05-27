//
//  main.cpp
//  robotics CV
//
//  Created by Aris Koumis on 1/18/17.
//  Made in collaboration with SJSU Robotics
//  Copyright Ã‚Â© 2017 Aris. All rights reserved.

#include <iostream>
#include <opencv2/opencv.hpp>
#include "Gate.h"
#include <fstream>
#include <vector>

using namespace std;
using namespace cv;

ofstream directionLog;

void createTrackbars();
void inputSetup();
void morphOps(Mat &threshold);
void drawObject(Gate gate_in, Mat &frame);
void trackFilteredObjects(Mat threshold, Mat &input);
void chooseDirection(Gate closestGate);
void outlineGates(Mat &frame);

//personal prefrence - adjust these at will
int FRAME_HEIGHT = 720;
int FRAME_WIDTH = 1280;

//adjusting these values changes filtered image
//I found these values to be sufficient for tennis ball detection
int H_MIN = 18;
int H_MAX = 127;
int S_MIN = 153;
int S_MAX = 256;
int V_MIN = 22;
int V_MAX = 256;

//used to ignore objects too large/small and incorrect object detection
int MIN_OBJECT_AREA = 10*10;
int MAX_OBJECT_AREA = (FRAME_HEIGHT * FRAME_WIDTH) / 1.5;
int MAX_NUM_OBJECTS = 4;

//Vector of tracked gates
vector<Gate> Gates;
vector<char> directionHistory;

VideoCapture capture;

int main() {
    inputSetup();
    //createTrackbars();
    
    Mat input, HSV, threshold;
    int flag=0;
    int x,y;
    
    while (1) {
        //grab frame from camera and assign to "input" matrix
        //capture.read() returns false if an error is encountered
        //while(flag==0){
	bool bSuccess = capture.read(input);
         if (!bSuccess) {
            cout << "Error in video capture. Exiting." << endl;
            flag=1; 
	    //break;
         }
        //}
        //Smoothing Image
        //GaussianBlur(input, input, Size( 3, 3), 0, 0);
        
        //RGB converstion to HSV
        cvtColor(input, HSV, CV_BGR2HSV);
        
        //filter out HSV values outside of Min/Max values for HSV
        //filtered image assigned to "threshold" matrix
        
        inRange(HSV, Scalar(H_MIN, S_MIN, V_MIN), Scalar(H_MAX, S_MAX, V_MAX), threshold);
        
        //Image refinement through morphological operations
        morphOps(threshold);
        
        //Find gates
        trackFilteredObjects(threshold, input);
	
	 //waitKey(30);
        //Draw gates on input video
        outlineGates(input);
        
        //display videos
        //imshow("Original", input);
//        imshow("HSV", HSV);
        //imshow("threshold", threshold);
        
        //exit if escape key is held for 30ms
        //        if (waitKey(30) == 27) {
        //            cout << "Escape button held. Exiting." << endl;
        //            cout << "H Min: " << H_MIN << endl;
        //            cout << "H Max: " << H_MAX << endl;
        //            cout << "S Min: " << S_MIN << endl;
        //            cout << "S Max: " << S_MAX << endl;
        //            cout << "V Min: " << V_MIN << endl;
        //            cout << "V Max: " << V_MAX << endl;
        //            break;
        //        }
        
        //input.release();
        //HSV.release();
        //threshold.release();
    }
    
    return 0;
}

void createTrackbars() {
    //declare window for trackbars
    namedWindow("Trackbars", 0);
    
    //creating sliders in "Trackbars" window
    createTrackbar("H_MIN", "Trackbars", &H_MIN, 256);
    createTrackbar("H_MAX", "Trackbars", &H_MAX, 256);
    createTrackbar("S_MIN", "Trackbars", &S_MIN, 256);
    createTrackbar("S_MAX", "Trackbars", &S_MAX, 256);
    createTrackbar("V_MIN", "Trackbars", &V_MIN, 256);
    createTrackbar("V_MAX", "Trackbars", &V_MAX, 256);
    
}

void inputSetup() {
    //open default webcam
    bool openStream  = capture.open("http://192.168.1.12:9001");
    if (!openStream) {
	cout << "ERROR: Unable to retreive video stream." << endl;
    } 
    capture.set(CV_CAP_PROP_FPS, 40);
    //set video frame dimensions
    capture.set(CV_CAP_PROP_FRAME_HEIGHT, FRAME_HEIGHT);
    capture.set(CV_CAP_PROP_FRAME_WIDTH, FRAME_WIDTH);
    //open direction output file
    //directionLog.open("direction.txt");
}

void morphOps(Mat &threshold) {
    //create structuring elements for matrix erosion/dialation
    //using elipse for structuring element (see openCV Docs for explanation)
    Mat erodeElement = getStructuringElement(MORPH_ELLIPSE, Size(7,7));
    Mat dialateElement = getStructuringElement(MORPH_ELLIPSE, Size(9,9));
    //double erosion to eliminate background noise from thresholded matrix
     erode(threshold, threshold, erodeElement);
    erode(threshold, threshold, erodeElement);
    
    //double dilation to fill in desired areas lost from previous erosion
    //    dilate(threshold, threshold, dialateElement);
    dilate(threshold, threshold, dialateElement);
}

void trackFilteredObjects(Mat threshold, Mat &input) {
    //create copy of thresholded matrix
    Mat temp;
    threshold.copyTo(temp);
    
    //create vectors for findContours()
    vector< vector<Point> > contours;
    vector<Vec4i> hierarchy;
    
    //using moments to find objects
    findContours(temp, contours, hierarchy, CV_RETR_CCOMP, CV_CHAIN_APPROX_SIMPLE);
    bool objectFound = false;
    double  refArea = 0;
    
    //    cout << "hierarchy: " << hierarchy.size() << endl;
    if (hierarchy.size() > 0) {
        int numObjects = hierarchy.size();
        if (numObjects<MAX_NUM_OBJECTS) {
            for (int index=0; index >=0; index = hierarchy[index][0]) {
                Moments moment = moments((Mat)contours[index]);
                double area = moment.m00;
                Gate Gate1;
                //ignoring found object if too small or too large
                if (area>MIN_OBJECT_AREA && area<MAX_OBJECT_AREA && area>refArea) {
                    int x = moment.m10/area;
                    int y = moment.m01/area;
                    objectFound = true;
                    refArea = area;
                    Gate Gate2(x, y, area);
                    Gate1 = Gate2;
                    //Output Gate Distance
                    //cout << Gate1.distance << endl;
                }
                else {
                    objectFound = false;
                }
                if (objectFound == true) {
                    Gates.push_back(Gate1);
                }
            }
        }
    }
}

void chooseDirection(Gate closestGate) {
    char direction;
    //cout << closestGate.x ;
    if (closestGate.x < 868 && closestGate.x > 360) {
        direction = 'C';
    }
    else if (closestGate.x >= 868) {
        direction = 'R';
    } else {
        direction = 'L';
    }
    
    if (directionHistory.empty() || directionHistory.back() != direction) {
        //directionLog.open("direction.txt");
        directionLog << direction << endl;
        cout << direction << "-" << closestGate.distance << endl;
        directionHistory.push_back(direction);
        //directionLog.close();
    }
}

void drawObject(Gate gate_in, Mat &frame) {
    circle(frame, Point(gate_in.x, gate_in.y), gate_in.radius, Scalar(0, 255, 0), 2);
}

void outlineGates(Mat &frame) {
    if (Gates.size() > 0) {
        int closestDistance = 0;
        int closestIndex = 0;
        for (int i=0; i<Gates.size(); i++) {
            drawObject(Gates[i], frame);
            if (Gates[i].distance < closestDistance || i == 0) {
                closestDistance = Gates[i].distance;
                closestIndex = i;
            }
        }
        chooseDirection(Gates[closestIndex]);
        
        Gates.clear();
    }
    else if (!directionHistory.empty()) {
        char direction = 'N';
        //directionLog.open("direction.txt");
        directionHistory.push_back(direction);
        directionLog << direction << endl;
        cout << direction << endl;
        //directionLog.close();
    }

    else{
        cout <<"N"<< endl;
    }
}
