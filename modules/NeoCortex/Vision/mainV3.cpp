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
void drawPoint(Point point_in, Mat &frame);
void trackFilteredObjects(Mat &threshold, Mat &input);
void chooseDirection(Gate closestGate, Mat &frame);
void chooseDirection(Point point_in, Mat &frame);
void outlineGates(Mat &frame);
void BGRNormalize(Mat &input, Mat &normalized);
Gate findMidpoint(Mat& input, Mat& threshold);

//personal prefrence - adjust these at will
int FRAME_HEIGHT = 480;
int FRAME_WIDTH = 640;

//adjusting these values changes filtered image
//I found these values to be sufficient for tennis ball detection
//int H_MIN = 23;
//int H_MAX = 40;
//int S_MIN = 0;
//int S_MAX = 255;
//int V_MIN = 0;
//int V_MAX = 240;
//
//HENRY'S
int H_MIN = 19;
int H_MAX = 40;
int S_MIN = 56;
int S_MAX = 255;
int V_MIN = 117;
int V_MAX = 240;

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
    createTrackbars();
    
    Mat input, HSV, threshold, normalized;
    
    while (1) {
        waitKey(30);
        //Input Matrix << Camera Frame
        bool bSuccess = capture.read(input);
        if (!bSuccess) {
            cout << "Error in video capture. Exiting." << endl;
            break;
        }
        
        //Normalize BGR Values
        //BGRNormalize(input, normalized);
        
        
        //RGB converstion to HSV
        cvtColor(input, HSV, CV_BGR2HSV);
        
        //Filter out HSV values outside of Min/Max values for HSV
        //Filtered image assigned to "threshold" matrix
        inRange(HSV, Scalar(H_MIN, S_MIN, V_MIN), Scalar(H_MAX, S_MAX, V_MAX), threshold);
        
        //Image refinement through morphological operations
        morphOps(threshold);
        
        //Find gates
        trackFilteredObjects(threshold, input);
        
        //Draw gates on input video
        outlineGates(input);
        
        //Display videos
        imshow("Original", input);
        imshow("Threshold", threshold);
        
        //Exit if escape key is held for 30ms
        if (waitKey(30) == 27) {
            cout << "Escape button held. Exiting." << endl;
            cout << "H Min: " << H_MIN << endl;
            cout << "H Max: " << H_MAX << endl;
            cout << "S Min: " << S_MIN << endl;
            cout << "S Max: " << S_MAX << endl;
            cout << "V Min: " << V_MIN << endl;
            cout << "V Max: " << V_MAX << endl;
            break;
        }
        
        input.release();
        HSV.release();
        threshold.release();
        normalized.release();
        
    }
    
    return 0;
}

Gate findMidpoint(Mat& input, Mat& threshold) {
    vector<Point> locations;
    findNonZero(threshold, locations);
    
    int avgX, avgY, minX, minY, radius;
    int maxX = 0;
    int maxY = 0;
    int size=locations.size();
    
    if (size != 0) {
        for (int i=0; i<size; i++) {
            if (i==0) {
                minX = locations[i].x;
                minY = locations[i].y;
            }
            if (locations[i].x < minX) {
                minX = locations[i].x;
            }
            if (locations[i].x > maxX) {
                maxX = locations[i].x;
            }
            if (locations[i].y < minY) {
                minY = locations[i].y;
            }
            if (locations[i].y > maxY) {
                maxY = locations[i].y;
            }
            
            avgX += locations[i].x;
            avgY += locations[i].y;
        }
        avgX /= size;
        avgY /= size;
        
        if (maxX - minX >= maxY - minY) {
            radius = maxX - avgX;
        }
        else {
            radius = maxY - avgY;
        }
        int area = 3.14*pow(radius, 2);
        if (area < MAX_OBJECT_AREA) {
            Gate gate(avgX, avgY, area);
            return gate;
        }
        
    }
    //If nothing is detected, return null point
    return Gate(NULL, NULL, NULL);
}

void morphOps(Mat &threshold) {
    //Smoothing Image
    //GaussianBlur(input, input, Size( 3, 3), 0, 0);
    
    //Create structuring elements for matrix erosion/dialation
    //Using elipse for structuring element (see openCV Docs for explanation)
    Mat erodeElement = getStructuringElement(MORPH_ELLIPSE, Size(7,7));
    Mat dialateElement = getStructuringElement(MORPH_ELLIPSE, Size(9,9));
    
    //Double erosion to eliminate background noise from thresholded matrix
    erode(threshold, threshold, erodeElement);
    erode(threshold, threshold, erodeElement);
    
    //Double dilation to fill in desired areas lost from previous erosion
    //    dilate(threshold, threshold, dialateElement);
    //    dilate(threshold, threshold, dialateElement);
}

void trackFilteredObjects(Mat &threshold, Mat &input) {
    //create copy of thresholded matrix
    Mat temp;
    threshold.copyTo(temp);
    
    //create vectors for findContours()
    vector< vector<Point> > contours;
    vector<Vec4i> hierarchy;
    
    //using moments to find objects
    findContours(temp, contours, hierarchy, CV_RETR_CCOMP, CV_CHAIN_APPROX_SIMPLE);
    bool objectFound = false;
    
    //Find Midpoint
    Gate midpointGate;
    midpointGate = findMidpoint(input, threshold);
    
    if (hierarchy.size() > 0) {
        //Number of Found Objects
        int numObjects = hierarchy.size();
        if (numObjects<MAX_NUM_OBJECTS) {
            for (int index=0; index <numObjects; index++) {
                Moments moment = moments((Mat)contours[index]);
                double area = moment.m00;
                Gate Gate1;
                
                //ignoring found object if too small or too large
                if (area>MIN_OBJECT_AREA && area<MAX_OBJECT_AREA) {
                    int x = moment.m10/area;
                    int y = moment.m01/area;
                    objectFound = true;
                    Gate Gate2(x, y, area);
                    Gate1 = Gate2;
                }
                else if (midpointGate.x != NULL) {
                    Gate1 = midpointGate;
                    objectFound = true;
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

void chooseDirection(Gate closestGate, Mat &frame) {
    char direction;
    int width = frame.cols;
    if (closestGate.x == NULL) {
        direction = 'N';
    }
    else if (closestGate.x < width*.1625) {
        direction = 'L';
    }
    else if (closestGate.x > width*(1-.1625)) {
        direction = 'R';
    }
    else {
        direction = 'C';
    }
    
    //directionLog.open("direction.txt");
    directionLog << direction << endl;
    cout << direction << "-" << closestGate.distance << endl;
    directionHistory.push_back(direction);
    //directionLog.close();
}

void drawObject(Gate gate_in, Mat &frame) {
    if (gate_in.radius > 0) {
            circle(frame, Point(gate_in.x, gate_in.y), gate_in.radius, Scalar(0, 255, 0), 2);
    }
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
        chooseDirection(Gates[closestIndex], frame);
        
        Gates.clear();
    }
    else if (!directionHistory.empty()) {
        char direction = 'N';
        directionHistory.push_back(direction);
        directionLog << direction << endl;
        cout << direction << endl;
    }
    
    else {
        cout <<"N"<< endl;
    }
}

void createTrackbars() {
    //declare window for trackbars
    namedWindow("Trackbars", 0);
    
    //creating sliders in "Trackbars" window
    createTrackbar("1 H_MIN", "Trackbars", &H_MIN, 179);
    createTrackbar("2 H_MAX", "Trackbars", &H_MAX, 179);
    createTrackbar("3 S_MIN", "Trackbars", &S_MIN, 255);
    createTrackbar("4 S_MAX", "Trackbars", &S_MAX, 255);
    createTrackbar("5 V_MIN", "Trackbars", &V_MIN, 255);
    createTrackbar("6 V_MAX", "Trackbars", &V_MAX, 255);
    
}

void inputSetup() {
    //open default webcam
    bool openStream  = capture.open(0);
    if (!openStream) {
        cout << "ERROR: Unable to retreive video stream." << endl;
    }
    capture.set(CV_CAP_PROP_FPS, 10);
    //set video frame dimensions
    capture.set(CV_CAP_PROP_FRAME_HEIGHT, FRAME_HEIGHT);
    capture.set(CV_CAP_PROP_FRAME_WIDTH, FRAME_WIDTH);
    //open direction output file
    //directionLog.open("direction.txt");
}

//void BGRNormalize(Mat& input, Mat& normalized) {
//    //Normalized RGB
//    Mat bgr_image_f(input.cols, input.rows, CV_32FC3);
//    input.convertTo(bgr_image_f, CV_32FC3);
//    imshow("test", bgr_image_f);
//
//    Mat blueAvg(input.cols, input.rows, CV_32FC1);
//    Mat greenAvg(input.cols, input.rows, CV_32FC1);
//    Mat redAvg(input.cols, input.rows, CV_32FC1);
//    Mat imgAvg(input.cols, input.rows, CV_32FC3);
//
//    vector<Mat> planes(3);
//    split(bgr_image_f, planes);
//
//    imshow("blue", planes[0]);
//    imshow("green", planes[1]);
//    imshow("red", planes[2]);
//
//    for (int y=0; y<input.rows; y++) {
//        for (int x=0; x<input.cols; x++) {
//            int blueValue = planes[0].at<uchar>(y,x);
//            int greenValue = planes[1].at<uchar>(y,x);
//            int redValue = planes[2].at<uchar>(y,x);
//
//            double sum = blueValue + greenValue + redValue;
//
//            planes[0].at<uchar>(y,x) = (blueValue/sum)*255;
//            planes[1].at<uchar>(y,x) = (greenValue/sum)*255;
//            planes[2].at<uchar>(y,x) = (redValue/sum)*255;
//
//        }
//    }
//
//    merge(planes, normalized);
//    imshow("Normalized", normalized);
//}

//void drawPoint(Point point_in, Mat &frame) {
//    if (point_in.x != NULL) {
//        circle(frame, point_in, 10, Scalar(0, 255, 0), 2);
//    }
//}

//void chooseDirection(Point point_in, Mat &frame) {
//    char direction;
//    int width = frame.cols;
//    if (point_in.x == NULL) {
//        direction = 'N';
//    }
//    else if (point_in.x < width*.1625) {
//        direction = 'L';
//    }
//    else if (point_in.x > width*(1-.1625)) {
//        direction = 'R';
//    }
//    else {
//        direction = 'C';
//    }
//    cout << direction << endl;
//}
