//
//  main.cpp
//  robotics CV
//
//  Created by Aris Koumis on 1/18/17.
//  Made in collaboration with SJSU Robotics
//  Copyright © 2017 Aris. All rights reserved.

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
int FRAME_HEIGHT = 480;
int FRAME_WIDTH = 640;

//adjusting these values changes filtered image
//I found these values to be sufficient for tennis ball detection
int H_MIN = 21;
int H_MAX = 35;
int S_MIN = 82;
int S_MAX = 206;
int V_MIN = 24;
int V_MAX = 256;

//used to ignore objects too large/small and incorrect object detection
int MIN_OBJECT_AREA = 20*20;
int MAX_OBJECT_AREA = (FRAME_HEIGHT * FRAME_WIDTH) / 1.5;
int MAX_NUM_OBJECTS = 4;

//Vector of tracked gates
vector<Gate> Gates;
vector<char> directionHistory;

VideoCapture capture;

int main() {
    inputSetup();
    createTrackbars();
    
    Mat input, HSV, threshold;
    
    //Template for cv::matchTemplate().
    //Mat tennisBall = imread("/Users/ariskoumis/Documents/Coding/openCV/Robotics CV/Robotics CV/ball_template.jpg");

    int x,y;
    
    while (1) {
        //grab frame from camera and assign to "input" matrix
        //capture.read() returns false if an error is encountered
        bool bSuccess = capture.read(input);
        if (!bSuccess) {
            cout << "Error in video capture. Exiting." << endl;
            break;
        }
        
        //Smoothing Image
        //GaussianBlur(input, input, Size( 3, 3), 0, 0);
        
        //RGB converstion to HSV
        cvtColor(input, HSV, CV_BGR2HSV);
        
        //filter out HSV values outside of Min/Max values for HSV
        //filtered image assigned to "threshold" matrix
        
        
        inRange(HSV, Scalar(H_MIN, S_MIN, V_MIN), Scalar(H_MAX, S_MAX, V_MAX), threshold);
        
        //Template matching
        //matchTemplate(threshold, tennisBall, threshold, CV_TM_SQDIFF);
        
        //Image refinement through morphological operations
        morphOps(threshold);
        
        //Find gates
        trackFilteredObjects(threshold, input);
        
        //Draw gates on input video
        outlineGates(input);
        
        //display videos
        imshow("Original", input);
        imshow("HSV", HSV);
        imshow("threshold", threshold);
        
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
        
        input.release();
        HSV.release();
        threshold.release();
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
    capture.open(0);
    //set video frame dimensions
    capture.set(CV_CAP_PROP_FRAME_HEIGHT, FRAME_HEIGHT);
    capture.set(CV_CAP_PROP_FRAME_WIDTH, FRAME_WIDTH);
    //open direction output file
    directionLog.open("direction.txt");
}

void morphOps(Mat &threshold) {
    //create structuring elements for matrix erosion/dialation
    //using elipse for structuring element (see openCV Docs for explanation)
    Mat erodeElement = getStructuringElement(MORPH_ELLIPSE, Size(3,3));
    Mat dialateElement = getStructuringElement(MORPH_ELLIPSE, Size(8,8));
    
    //double erosion to eliminate background noise from thresholded matrix
//    erode(threshold, threshold, erodeElement);
    erode(threshold, threshold, erodeElement);
    
    //double dilation to fill in desired areas lost from previous erosion
    dilate(threshold, threshold, dialateElement);
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
    
    if (closestGate.x >= 320) {
        direction = 'R';
    } else {
        direction = 'L';
    }
    
    if (directionHistory.empty() || directionHistory.back() != direction) {
        directionLog << direction << endl;
        directionHistory.push_back(direction);
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
}


