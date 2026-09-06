import userModel from "../models/usermodel.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import sessionModel from "../models/sessionmodel.js";
import { sendEmail } from "../services/email.service.js";
import { generateOtp, getOtpHtml } from "../utils/utils.js";
import otpModel from "../models/otp.model.js";

export async function register(req, res) {

    const { username, email, password } = req.body;

    // iska matlab hai ki ye check karge ki kya ek bhi username or email already registered hai ki nahi

    const isAlreadyRegistered = await userModel.findOne({
        $or: [
            { username },
            { email }
        ]
    })

    if (isAlreadyRegistered) {
        return res.status(400).json({
            message: "Username or email already exists"
        })
    }

    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

    const user = await userModel.create({
        username,
        email,
        password: hashedPassword
    })

    const otp = generateOtp();
    const html = getOtpHtml(otp);

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    await otpModel.create({
        email,
        user: user._id,
        otpHash
    })

    await sendEmail(email,"OTP Verification", `Your OTP code is ${otp}`,html)
    
   
    res.status(201).json({
        message: "User Registered Successfully",
        user: {
            username: user.username,
            email: user.email,
            verified: user.verfied
        },
        
    })


}

export async function login(req, res) {

    const { email, password } = req.body;

    const user = userModel.findOne({ email })

    if(!user.verified) {
        return res.status(401).json({
           message: "Email Not Verified"
        })
    }
    if (!email) {
        return res.status(400).json({
            message: "Invalid User"
        })
    }

    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

    const isPasswordValid = hashedPassword === user.password;

    if (!isPasswordValid) {
        return res.status(400).json({
            message: "Invalid Password"
        })
    }

    const refreshToken = jwt.sign({

        id: user_id
    }, config.JWT_SECRET,
        {
            expiresIn: "7d"
        });

    const session = await sessionModel.create({
        user: user._id,
        refreshTokenHash: refreshTokenHash,
        ip: req.ip || "unknown",
        userAgent: req.headers["user-agent"] || "unknown"
    });
    const accesstoken = jwt.sign({
        id: user._id,
        sessionID: session._id

    }, config.JWT_SECRET,
        {
            expiresIn: "15m"
        });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
        message: "User Loggedin Successfully",
        user: {
            username: user.username,
            email: user.email,
        },
        accesstoken,
    });



}

// This is a get-me function which actually checks whether the user who is 
// requesting is login or not and if the user is logged-in we are displaying the
// the data of that specific user
// for checking purpose we are verifying that if the user is registered the user should have a token
// so our goal is to verify the token of the user whose trying to request 
// and always remeber adi token always comes in the header see we used it below

export async function getMe(req, res) {

    const token = req.headers.authorization?.split(" ")[1];

    if (!accesstoken) {
        return res.status(401).json({
            message: "User Not Found"
        })
    }
    // This Line is For Verifying purpose

    const decoded = jwt.verify(accesstoken, config.JWT_SECRET);

    // Here we decoded the token after decoding we will get the user id because while creating token we have set token as user_id
    const user = await userModel.findById(decoded.id);

    res.status(200).json({
        message: "Hello Here's Your Info",
        user: {
            username: user.username,
            email: user.email,
        }
    })

}

export async function refreshToken(req, res) {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({
            message: "refresh token not found"
        }
        )
    }

    const decoded = jwt.verify(refreshToken, config.JWT_SECRET);

    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    const session = await sessionModel.findOne({
        refreshTokenHash,
        revoke: false
    })
    if (!session) {
        return res.status(401).json({
            message: "Invalid Refresh Token"
        })
    }
    const accesstoken = jwt.sign({
        id: decoded.id,
    }, config.JWT_SECRET,
        {
            expiresIn: "15m"
        }
    )
    // For Extra Security Purpose we also keep changing our refresh token with our Access Token 
    const newrefreshToken = jwt.sign({
        id: user._id
    }, config.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    )

    const newrefreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    session.refreshTokenHash = newrefreshTokenHash;
    await session.save();

    res.cookie("newrefreshToken", newrefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    })

    res.status(200).json({
        message: "Access Token Generated Successfully",
        token: accesstoken,
    })
}

export async function logout(req, res) {

    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(400).json({
            message: "Refresh Token Not Found"
        })
    }

    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    // Finding the session for the user who need to logout

    const session = await sessionModel.findOne({
        refreshTokenHash,
        revoked: false
    })
    if (!session) {
        return res.status(400).json({
            message: "Session Not Found"
        })
    }
    session.revoked = true;
    await session.save();

    res.clearCookie("refreshToken")

    res.status(200).json({
        message: "You LoggedOut Successfully"
    })
}

export async function logoutall(req, res) {

    const refreshToken = req.cookies.refreshToken

    if (!refreshToken) {
        return res.status(400).json({
            message: "User Not Found"
        })
    }

    const decoded = jwt.verify(accesstoken, config.JWT_SECRET);

    // Ye function uss user ney jitney bhi id sey login kiya tha tabhi tabhi unkay session bhi baney hongey
    // toh abhi wo user id sey bani saarey session ko revoke karga matlab sab sey refresh token udd jayega 

    await sessionModel.updateMany({
        // Konsi cheez ko update karna hai aur kya update karna hai 
        user: decoded._id,
        revoked: false
    },
        // Kya Update karna hai wo likha hai
        {
            revoked: true
        })
    res.clearCookie("refreshToken")

    res.status(200).json({
        message: "Logged out from all device's"
    })
}

export async function verifyEmail(req, res) {
    const { otp, email } = req.body

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    
    const otpDoc = await otpModel.findOne({
        email,
        otpHash
    })


if(!otpDoc){
    return res.status(400).json({
        message: "You Never register this email"
    });
}

  const user = await userModel.findByIdAndUpdate(
        otpDoc.user,
        { verified: true },
        { new: true }
    );

    await otpModel.deleteMany({
        user: otpDoc.user
    })

    return res.status(200).json({
        message: "Email Verified Successfully ",
        user: {
            username: user.username,
            email: user.email,
            verfied: user.verfied
        }
    })
}



