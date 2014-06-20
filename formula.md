Simplified, this is what it does (wish somebody gave this explanation to me):

dt = delta

    FOREACH PARTICLE p
        p.vel = (pos - posOld) / dt
        p.posOld = pos
        p.vel += gravity * dt
        p.pos += p.vel * dt
        p.dens = 0
        p.densN = 0

    FOREACH PARTICLE p
        FOREACH PARTICLE p2
            if (dist(p,p2) &lt; K_smoothingRadius)
                createPair(p, p2)

    FOREACH PAIR p (of particles A B)
        Q = 1 - dist(A, B) / K_smoothingRadius
        p.q2 = Q^2
        p.q3 = Q^3
        A.dens += Q2
        B.dens += Q2
        A.densN += Q3
        B.densN += Q3

    FOREACH PARTICLE p
        p.press = K_stiff * (p.dens - K_restDensity)
        p.pressN = K_stiffN * p.densN

    FOREACH PAIR p (of particles A B)
        press = A.press + B.press
        pressN = A.pressN + B.pressN
        displace = (press*p.q2 + press*p.q3) *(dt^2)
        a2bN = directionNormal(A, B) // or b2a
        A.pos += displace * a2bN
        B.pos -= displace * a2bN
