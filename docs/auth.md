Tattoola User Authentication Flow Documentation

"Login"
Visual Layout
The login screen presents a clean, centered form with the Tattoola branding at the top.
Form Components
Email Field

Label: "Email"
Input field: Standard text input for email address
Placeholder text: "Email"
Validation: Email format required

Password Field

Label: "Enter password"
Input field: Masked password input
Placeholder text: "Password"
Validation: Must match registered password

Forgot Password Link

Text: "Forgot your password?"
Position: Below password field
Action: Redirects to password recovery flow

Login Button

Text: "Login"
Style: Primary call-to-action button
Position: Below the forgot password link
Action: Submits credentials and authenticates user

Navigation Links
New User Registration

Text: "Not registered? Register"
Action: Redirects to appropriate registration flow

Artist Account Option

Text: "Or are you an Artist?"
Action: Redirects to artist registration/login flow

Functional Notes
The login screen serves as the entry point for returning users of both types (normal users and artists). It authenticates credentials and routes users to their appropriate dashboard or profile based on their account type. The screen maintains consistent styling with the registration flows and includes clear pathways for users who need to create an account or recover their password.


Normal User Authentication Flow
1. Registration Screen (Italian/English)
Registration Form

Username (unique name required)
Email
Password (minimum 8 characters, at least one number)
Confirm Password
Terms acceptance checkbox: "I have read the Terms of Use and Privacy Policy"
Registration button
Links: "Already have an account? Log in" / "Or are you an Artist?"

2. Email Confirmation
Email sent to user:

Greeting: "Hello {username}"
Message: "Thank you for registering on Tattoola! To complete the registration process, please confirm your email address."
Confirm Email button/link
Footer: "If you didn't request this email, you can safely ignore it."

3. Email Confirmed
Confirmation page:

4. Additional Information
Personal details form:

First Name
Last Name
Phone Number (+39 prefix for Italy)
Note: "This information is used only to register your account and will never be published on your profile"

5. Location Information
Where are you located:

Province (dropdown selection - e.g., AGRIGENTO)
Municipality/Comune (dropdown selection - e.g., Aragona)

6. Profile Photo
Photo upload (optional):

Upload your photo
Supports JPG, PNG, max size 5MB

7. Social Media Links
Social profiles (optional):

Instagram username
TikTok username

8. Favorite Styles
Style selection:

Choose up to 4 favorite styles
Counter showing: "0 selected"
Options include: 3D, Abstract, Anime, Black & Grey, etc.
Note: Select using checkbox images

9. Profile Type
Privacy settings:

Public Profile: Your tattoos and followed artists will be visible on your page
Private Profile: Your tattoos and followed artists are visible only to you


Artist User Authentication Flow
1. Login Section
Login form:

Email
Password
"Forgot password?" link
Login button
Links: "Not registered? Register" / "Or are you an Artist?"

2. Artist Registration
Registration as Artist:

Username (unique name required)
Email
Password (minimum 8 characters, at least one number)
Confirm Password
Registration button
"Already have an account? Log in" link

3. Email Confirmation
Email sent to artist:

Greeting: "Hello {user}"
Confirmation message (same as normal user)
Confirm Email button/link

4. Email Confirmed
Confirmation page:

5. Personal Information
Name details:

Your First Name
Your Last Name

6. Profile Photo
Photo upload (optional):

Upload your photo
Supports JPG, PNG, max size 5MB

7. Working Arrangements
Work mode selection:

"I am the owner of my own studio"
"I am a tattoo artist working in a studio"
"I am a freelance tattoo artist"

8. Business Information
Studio/Business details:

Business/Studio name
Province (dropdown)
Municipality (dropdown)
Studio address
Website (optional)
Phone number
Certifications: Upload certificates/attestations proving authorization to practice as tattoo artist in Italy, along with ID copy
Note: "This allows our staff to verify your identity and prevent unauthorized registrations"
File upload: Copy/paste or browse files

9. Bio
About section (optional):

"Tell us something about yourself (you can do this later if you want)"

10. Favorite Styles
Style preferences:

Choose up to 2 styles that will appear on your page
Counter: "2 selected"
Options: 3D, Abstract, etc.
Note: Checkbox selection for multiple styles based on plan

11. Main Style
Primary style selection:

Among favorite styles, only 1 can be your main preferred style
Radio button selection from: 3D, Abstract, etc.

12. Services Offered
Service selection (multiple):

Blast-over
Free consultation
Additional services (...)

13. Body Parts
Working areas:

Select body parts you work on (multiple selection)
Options: Behind the ear, Ears, Face, Genitals, etc.

14. Rates
Pricing information:

Minimum price for a job (e.g., 100€, 200€)
Hourly rate (optional)

15. Favorite Projects
Portfolio setup:

Add 4 of your favorite projects
For each project:

Upload photos (up to 5 photos: JPG, PNG, max 5MB)
Upload videos (up to 2 videos: MOV, MP4, AVI, max 10MB)
Add description or meaning
Associate style(s) with the tattoo (multiple selection)


Note: "for each project" - this step repeats 4 times

16. Plan Selection
Subscription tiers:
Basic Plan - Free:

Up to 6 jobs
One main preferred style
Access to private requests only

Premium Plan - €39/month:

Unlimited jobs organized in collections
Up to 2 main preferred styles
Priority access to customer requests
Add years of experience
Add cover photo/video to page

Studio Plan - €79/month:

Link multiple artist accounts under same studio
Up to 3 main preferred styles
Create studio page
Priority access and campaign discounts

Agreement:

"By clicking 'Next,' you agree to the Terms of Service"


Notes & Considerations
Open Questions:

"While setting up artist profile we ask for their 4 works - so where and how will we show them? Works vs post"

Key Differences Between User Types:

Normal users: 4 favorite styles, simpler setup
Artists: 2 favorite styles (expandable with plan), extensive professional information, certification requirements, pricing, portfolio projects