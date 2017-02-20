//
//  Gate.cpp
//  robotics CV
//
//  Created by Aris on 2/4/17.
//  Copyright © 2017 Aris. All rights reserved.
//

#include <iostream>
#include "Gate.h"
#include <cmath>
using namespace std;

Gate::Gate() : x(0), y(0), radius(0), area(0), distance(0) {};
Gate::Gate(int x_in, int y_in, int area_in) : x(x_in), y(y_in), area(area_in) {
    radius = pow(area/(3.14) , .5);
    calculate_distance();
}
Gate::Gate(int x_in, int y_in, int radius_in, int area_in) : x(x_in), y(y_in), radius(radius_in), area(area_in) {
    calculate_distance();
};
Gate::Gate(const Gate& gate_object) : x(gate_object.x), y(gate_object.y), radius(gate_object.radius), area(gate_object.area) {
    calculate_distance();
};
Gate::~Gate() {
    ;
}

void Gate::operator=(const Gate& right_side) {
    if (this == &right_side) return;
    x = right_side.x;
    y = right_side.y;
    radius = right_side.radius;
    area = right_side.area;
    distance = right_side.distance;
}

ostream& operator << (ostream& outs, const Gate& gate_temp) {
    cout << "X Position: " << gate_temp.x << endl;
    cout << "Y Position: " << gate_temp.y << endl;
    cout << "Radius: " << gate_temp.radius << endl;
    cout << "Area: " << gate_temp.area << endl;
    
    return outs;
}

void Gate::calculate_distance() {
    int diameter = radius * 2;
    float focal_distance = 640;
    float ball_width = 2.5;
    distance = (focal_distance * ball_width) / diameter;
    
}
