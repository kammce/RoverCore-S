//
//  Gate.h
//  robotics CV
//
//  Created by Aris on 2/4/17.
//  Copyright © 2017 Aris. All rights reserved.
//

using namespace std;

#ifndef Gate_h
#define Gate_h

#include <iostream>

class Gate {
public:
    Gate();
    Gate(int x_in, int y_in, int area_in);
    Gate(int x_in, int y_in, int radius_in, int area_in);
    Gate(const Gate& gate_object);
    ~Gate();
    friend ostream& operator << (ostream& outs, const Gate& gate_temp);
    void operator=(const Gate &right_hand);
    void calculate_distance();
    int x;
    int y;
    int radius;
    int area;
    float distance;
private:
};

#endif /* Gate_h */
