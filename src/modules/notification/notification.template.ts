function template(strings, ...keys) {
    return (...values) => {
      const dict = values[values.length - 1] || {};
      const result = [strings[0]];
      keys.forEach((key, i) => {
        const value = Number.isInteger(key) ? values[key] : dict[key];
        result.push(value, strings[i + 1]);
      });
      return result.join('');
    };
  }
  
  const t1Closure = template`${0}${1}${0}!`;
  t1Closure('Y', 'A'); // "YAY!"
  
  const t2Closure = template`${0} ${'foo'}!`;
  t2Closure('Hello', { foo: 'World' }); // "Hello World!"
  
  const t3Closure = template`I'm ${'name'}. I'm almost ${'age'} years old.`;
  t3Closure('foo', { name: 'MDN', age: 30 }); //"I'm MDN. I'm almost 30 years old."
  t3Closure({ name: 'MDN', age: 30 }); //"I'm MDN. I'm almost 30 years old.
  

  
  // export const activateNotificationTemplate = template`
  // <!DOCTYPE html>
  // <html
  //   style="
  //     font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  //     box-sizing: border-box;
  //     font-size: 14px;
  //     margin: 0;
  //   "
  // >
  //   <head>
  //     <meta name="viewport" content="width=device-width" />
  //     <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  //     <title>Reset Password</title>
  
  //     <style type="text/css">
  //       img {
  //         max-width: 100%;
  //       }
  //       body {
  //         -webkit-font-smoothing: antialiased;
  //         -webkit-text-size-adjust: none;
  //         width: 100% !important;
  //         height: 100%;
  //         line-height: 1.6em;
  //       }
  //       body {
  //         background-color: #f6f6f6;
  //       }
  //       @media only screen and (max-width: 640px) {
  //         body {
  //           padding: 0 !important;
  //         }
  //         h1 {
  //           font-weight: 800 !important;
  //           margin: 20px 0 5px !important;
  //         }
  //         h2 {
  //           font-weight: 800 !important;
  //           margin: 20px 0 5px !important;
  //         }
  //         h3 {
  //           font-weight: 800 !important;
  //           margin: 20px 0 5px !important;
  //         }
  //         h4 {
  //           font-weight: 800 !important;
  //           margin: 20px 0 5px !important;
  //         }
  //         h1 {
  //           font-size: 22px !important;
  //         }
  //         h2 {
  //           font-size: 18px !important;
  //         }
  //         h3 {
  //           font-size: 16px !important;
  //         }
  //         .container {
  //           padding: 0 !important;
  //           width: 100% !important;
  //         }
  //         .content {
  //           padding: 0 !important;
  //         }
  //         .content-wrap {
  //           padding: 10px !important;
  //         }
  //         .invoice {
  //           width: 100% !important;
  //         }
  //       }
  //     </style>
  //   </head>
  
  //   <body
  //     itemscope
  //     itemtype="http://schema.org/EmailMessage"
  //     style="
  //       font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  //       box-sizing: border-box;
  //       font-size: 14px;
  //       -webkit-font-smoothing: antialiased;
  //       -webkit-text-size-adjust: none;
  //       width: 100% !important;
  //       height: 100%;
  //       line-height: 1.6em;
  //       background-color: #f6f6f6;
  //       margin: 0;
  //     "
  //     bgcolor="#f6f6f6"
  //   >
  //     <table
  //       class="body-wrap"
  //       style="
  //         font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  //         box-sizing: border-box;
  //         font-size: 14px;
  //         width: 100%;
  //         background-color: #f6f6f6;
  //         margin: 0;
  //       "
  //       bgcolor="#f6f6f6"
  //     >
  //       <tr
  //         style="
  //           font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  //           box-sizing: border-box;
  //           font-size: 14px;
  //           margin: 0;
  //         "
  //       >
  //         <td
  //           style="
  //             font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  //             box-sizing: border-box;
  //             font-size: 14px;
  //             vertical-align: top;
  //             margin: 0;
  //           "
  //           valign="top"
  //         ></td>
  //         <td
  //           class="container"
  //           width="600"
  //           style="
  //             font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  //             box-sizing: border-box;
  //             font-size: 14px;
  //             vertical-align: top;
  //             display: block !important;
  //             max-width: 600px !important;
  //             clear: both !important;
  //             margin: 0 auto;
  //           "
  //           valign="top"
  //         >
  //           <div
  //             class="content"
  //             style="
  //               font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  //               box-sizing: border-box;
  //               font-size: 14px;
  //               max-width: 600px;
  //               display: block;
  //               margin: 0 auto;
  //               padding: 20px;
  //             "
  //           >
  //             <table
  //               class="main"
  //               width="100%"
  //               cellpadding="0"
  //               cellspacing="0"
  //               itemprop="action"
  //               itemscope
  //               itemtype="http://schema.org/ConfirmAction"
  //               style="
  //                 font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  //                 box-sizing: border-box;
  //                 font-size: 14px;
  //                 border-radius: 3px;
  //                 background-color: #fff;
  //                 margin: 0;
  //                 border: 1px solid #e9e9e9;
  //               "
  //               bgcolor="#fff"
  //             >
  //               <tr
  //                 style="
  //                   font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  //                   box-sizing: border-box;
  //                   font-size: 14px;
  //                   margin: 0;
  //                 "
  //               >
  //                 <td
  //                   class="content-wrap"
  //                   style="
  //                     font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  //                     box-sizing: border-box;
  //                     font-size: 14px;
  //                     vertical-align: top;
  //                     margin: 0;
  //                     padding: 20px;
  //                   "
  //                   valign="top"
  //                 >
  //                   <meta
  //                     itemprop="name"
  //                     content="Confirm Email"
  //                     style="
  //                       font-family: 'Helvetica Neue', Helvetica, Arial,
  //                         sans-serif;
  //                       box-sizing: border-box;
  //                       font-size: 14px;
  //                       margin: 0;
  //                     "
  //                   />
  //                   <table
  //                     width="100%"
  //                     cellpadding="0"
  //                     cellspacing="0"
  //                     style="
  //                       font-family: 'Helvetica Neue', Helvetica, Arial,
  //                         sans-serif;
  //                       box-sizing: border-box;
  //                       font-size: 14px;
  //                       margin: 0;
  //                     "
  //                   >
  //                     <tr
  //                       style="
  //                         font-family: 'Helvetica Neue', Helvetica, Arial,
  //                           sans-serif;
  //                         box-sizing: border-box;
  //                         font-size: 14px;
  //                         margin: 0;
  //                       "
  //                     >
  //                       <td
  //                         class="content-block"
  //                         style="
  //                           font-family: 'Helvetica Neue', Helvetica, Arial,
  //                             sans-serif;
  //                           box-sizing: border-box;
  //                           font-size: 14px;
  //                           vertical-align: top;
  //                           margin: 0;
  //                           padding: 0 0 20px;
  //                         "
  //                         valign="top"
  //                       >
  //                         Hello <strong>${'name'}</strong>, <br />
  //                         Please confirm your email address by clicking the link
  //                         below.
  //                       </td>
  //                     </tr>
  //                     <tr
  //                       style="
  //                         font-family: 'Helvetica Neue', Helvetica, Arial,
  //                           sans-serif;
  //                         box-sizing: border-box;
  //                         font-size: 14px;
  //                         margin: 0;
  //                       "
  //                     >
  //                       <td
  //                         class="content-block"
  //                         style="
  //                           font-family: 'Helvetica Neue', Helvetica, Arial,
  //                             sans-serif;
  //                           box-sizing: border-box;
  //                           font-size: 14px;
  //                           vertical-align: top;
  //                           margin: 0;
  //                           padding: 0 0 20px;
  //                         "
  //                         valign="top"
  //                       >
  //                         We may need to send you critical information about our
  //                         service and it is important that we have an accurate
  //                         email address.
  //                       </td>
  //                     </tr>
  //                     <tr
  //                       style="
  //                         font-family: 'Helvetica Neue', Helvetica, Arial,
  //                           sans-serif;
  //                         box-sizing: border-box;
  //                         font-size: 14px;
  //                         margin: 0;
  //                       "
  //                     >
  //                       <td
  //                         class="content-block"
  //                         itemprop="handler"
  //                         itemscope
  //                         itemtype="http://schema.org/HttpActionHandler"
  //                         style="
  //                           font-family: 'Helvetica Neue', Helvetica, Arial,
  //                             sans-serif;
  //                           box-sizing: border-box;
  //                           font-size: 14px;
  //                           vertical-align: top;
  //                           margin: 0;
  //                           padding: 0 0 20px;
  //                         "
  //                         valign="top"
  //                       >
  //                         <a
  //                           href="${'link'}"
  //                           class="btn-primary"
  //                           itemprop="url"
  //                           style="
  //                             font-family: 'Helvetica Neue', Helvetica, Arial,
  //                               sans-serif;
  //                             box-sizing: border-box;
  //                             font-size: 14px;
  //                             color: #fff;
  //                             text-decoration: none;
  //                             line-height: 2em;
  //                             font-weight: bold;
  //                             text-align: center;
  //                             cursor: pointer;
  //                             display: inline-block;
  //                             border-radius: 5px;
  //                             text-transform: capitalize;
  //                             background-color: #348eda;
  //                             margin: 0;
  //                             border-color: #348eda;
  //                             border-style: solid;
  //                             border-width: 10px 20px;
  //                           "
  //                           >Confirm email address</a
  //                         >
  //                       </td>
  //                     </tr>
  //                     <tr
  //                       style="
  //                         font-family: 'Helvetica Neue', Helvetica, Arial,
  //                           sans-serif;
  //                         box-sizing: border-box;
  //                         font-size: 14px;
  //                         margin: 0;
  //                       "
  //                     >
  //                       <td
  //                         class="content-block"
  //                         style="
  //                           font-family: 'Helvetica Neue', Helvetica, Arial,
  //                             sans-serif;
  //                           box-sizing: border-box;
  //                           font-size: 14px;
  //                           vertical-align: top;
  //                           margin: 0;
  //                           padding: 0 0 20px;
  //                         "
  //                         valign="top"
  //                       >
  //                         &mdash; <a style="text-align: center" href="https://jota.ng"><u>JOTA</u></a>
  //                       </td>
  //                     </tr>
  //                   </table>
  //                 </td>
  //               </tr>
  //             </table>
  //             <div
  //               class="footer"
  //               style="
  //                 font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  //                 box-sizing: border-box;
  //                 font-size: 14px;
  //                 width: 100%;
  //                 clear: both;
  //                 color: #999;
  //                 margin: 0;
  //                 padding: 20px;
  //               "
  //             >
  //               <table
  //                 width="100%"
  //                 style="
  //                   font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  //                   box-sizing: border-box;
  //                   font-size: 14px;
  //                   margin: 0;
  //                 "
  //               >
  //                 <tr
  //                   style="
  //                     font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  //                     box-sizing: border-box;
  //                     font-size: 14px;
  //                     margin: 0;
  //                   "
  //                 >
  //                   <td
  //                     class="aligncenter content-block"
  //                     style="
  //                       font-family: 'Helvetica Neue', Helvetica, Arial,
  //                         sans-serif;
  //                       box-sizing: border-box;
  //                       font-size: 12px;
  //                       vertical-align: top;
  //                       color: #999;
  //                       text-align: center;
  //                       margin: 0;
  //                       padding: 0 0 20px;
  //                     "
  //                     align="center"
  //                     valign="top"
  //                   >
  // <!--                    <a href="https://jota.ng">JOTA Team</a>-->
  //                   </td>
  //                 </tr>
  //               </table>
  //             </div>
  //           </div>
  //         </td>
  //         <td
  //           style="
  //             font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  //             box-sizing: border-box;
  //             font-size: 14px;
  //             vertical-align: top;
  //             margin: 0;
  //           "
  //           valign="top"
  //         ></td>
  //       </tr>
  //     </table>
  //   </body>
  // </html>
  //   `;
  

  export const activateNotificationTemplate = template`
  <!DOCTYPE html>
  <html style="font-family: Arial, sans-serif; font-size: 14px; background-color: #f6f6f6; margin: 0; padding: 0;">
    <body style="width: 100%; height: 100%; background-color: #f6f6f6; margin: 0;">
      <table style="width: 100%; background-color: #f6f6f6; margin: 0;">
        <tr>
          <td></td>
          <td style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #fff; border: 1px solid #e9e9e9; border-radius: 3px; padding: 20px;">
              <p>Hello <strong>{name}</strong>,</p>
              <p>Please confirm your email address by clicking the link below:</p>
              <p><a href="{link}" style="display: inline-block; padding: 10px 20px; background-color: #348eda; color: #fff; text-decoration: none; border-radius: 5px;">Confirm Email Address</a></p>
              <p>We may need to send you important information, so please ensure your email address is accurate.</p>
              <p>— The JOTA Team</p>
            </div>
            <p style="text-align: center; color: #999; padding: 20px;">Follow us on 
              <a href="#" style="color: #999; text-decoration: underline;">Twitter</a> | 
              <a href="#" style="color: #999; text-decoration: underline;">Facebook</a> | 
              <a href="#" style="color: #999; text-decoration: underline;">LinkedIn</a>
            </p>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
  

  export const forgotPassNotificationTemplate = (name: string, link: string) => `
  <!DOCTYPE html>
  <html style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
    <head>
      <meta name="viewport" content="width=device-width" />
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <title>Forgot Password</title>
      <style type="text/css">
        img { max-width: 100%; }
        body { -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none; width: 100% !important; height: 100%; line-height: 1.6em; background-color: #f6f6f6; margin: 0; }
        @media only screen and (max-width: 640px) {
          body { padding: 0 !important; }
          h1, h2, h3, h4 { font-weight: 800 !important; margin: 20px 0 5px !important; }
          h1 { font-size: 22px !important; }
          h2 { font-size: 18px !important; }
          h3 { font-size: 16px !important; }
          .container { padding: 0 !important; width: 100% !important; }
          .content { padding: 0 !important; }
          .content-wrap { padding: 10px !important; }
          .invoice { width: 100% !important; }
        }
      </style>
    </head>
    <body itemscope itemtype="http://schema.org/EmailMessage" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none; width: 100% !important; height: 100%; line-height: 1.6em; background-color: #f6f6f6; margin: 0;" bgcolor="#f6f6f6">
      <table class="body-wrap" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; width: 100%; background-color: #f6f6f6; margin: 0;" bgcolor="#f6f6f6">
        <tr style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
          <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0;" valign="top"></td>
          <td class="container" width="600" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; display: block !important; max-width: 600px !important; clear: both !important; margin: 0 auto;" valign="top">
            <div class="content" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; max-width: 600px; display: block; margin: 0 auto; padding: 20px;">
              <table class="main" width="100%" cellpadding="0" cellspacing="0" itemprop="action" itemscope itemtype="http://schema.org/ConfirmAction" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; border-radius: 3px; background-color: #fff; margin: 0; border: 1px solid #e9e9e9;" bgcolor="#fff">
                <tr style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                  <td class="content-wrap" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 20px;" valign="top">
                    <meta itemprop="name" content="Confirm Email" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />
                    <table width="100%" cellpadding="0" cellspacing="0" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                      <tr style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                        <td class="content-block" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                          Hello <strong>${name}</strong>, <br />
                          We received a request to reset the password for your account.
                        </td>
                      </tr>
                      <tr style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                        <td class="content-block" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                          To reset your password, click the button below.
                        </td>
                      </tr>
                      <tr style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                        <td class="content-block" itemprop="handler" itemscope itemtype="http://schema.org/HttpActionHandler" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                          <a href="${link}" class="btn-primary" itemprop="url" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; color: #fff; text-decoration: none; line-height: 2em; font-weight: bold; text-align: center; cursor: pointer; display: inline-block; border-radius: 5px; text-transform: capitalize; background-color: #348eda; margin: 0; border-color: #348eda; border-style: solid; border-width: 10px 20px;">
                            Reset Password
                          </a>
                        </td>
                      </tr>
                      <tr style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                        <td class="content-block" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                          &mdash; <a href="https://jota.ng" style="text-align: center;"><u>JOTA</u></a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <div class="footer" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; width: 100%; clear: both; color: #999; margin: 0; padding: 20px;">
                <table width="100%" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                  <tr style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                    <td class="aligncenter content-block" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 12px; vertical-align: top; color: #999; text-align: center; margin: 0; padding: 0 0 20px;" align="center" valign="top">
                      <!-- <a href="https://jota.ng">JOTA Team</a> -->
                    </td>
                  </tr>
                </table>
              </div>
            </div>
          </td>
          <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0;" valign="top"></td>
        </tr>
      </table>
    </body>
  </html>`;
  

export const createPasswordTemplate = template`
<!DOCTYPE html>
<html style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
<head>
  <meta name="viewport" content="width=device-width" />
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <title>Forgot Password</title>
  <style type="text/css">
    img {
      max-width: 100%;
    }
    body {
      -webkit-font-smoothing: antialiased;
      -webkit-text-size-adjust: none;
      width: 100% !important;
      height: 100%;
      line-height: 1.6em;
      background-color: #f6f6f6;
      margin: 0;
    }
    @media only screen and (max-width: 640px) {
      body {
        padding: 0 !important;
      }
      h1, h2, h3, h4 {
        font-weight: 800 !important;
        margin: 20px 0 5px !important;
      }
      h1 {
        font-size: 22px !important;
      }
      h2 {
        font-size: 18px !important;
      }
      h3 {
        font-size: 16px !important;
      }
      .container, .content {
        padding: 0 !important;
        width: 100% !important;
      }
      .content-wrap {
        padding: 10px !important;
      }
      .invoice {
        width: 100% !important;
      }
    }
  </style>
</head>

<body itemscope itemtype="http://schema.org/EmailMessage" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none; width: 100% !important; height: 100%; line-height: 1.6em; background-color: #f6f6f6; margin: 0;" bgcolor="#f6f6f6">
  <table class="body-wrap" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; width: 100%; background-color: #f6f6f6; margin: 0;" bgcolor="#f6f6f6">
    <tr>
      <td></td>
      <td class="container" width="600" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; max-width: 600px !important; margin: 0 auto;">
        <div class="content" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; max-width: 600px; margin: 0 auto; padding: 20px;">
          <table class="main" width="100%" cellpadding="0" cellspacing="0" itemprop="action" itemscope itemtype="http://schema.org/ConfirmAction" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; border-radius: 3px; background-color: #fff; margin: 0; border: 1px solid #e9e9e9;" bgcolor="#fff">
            <tr>
              <td class="content-wrap" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 20px;" valign="top">
                <meta itemprop="name" content="Confirm Email" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td class="content-block" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                      Hello <strong>${'name'}</strong>, <br />
                      We received a request to reset the password for your account.
                    </td>
                  </tr>
                  <tr>
                    <td class="content-block" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                      To create your password, click the button below.
                    </td>
                  </tr>
                  <tr>
                    <td class="content-block" itemprop="handler" itemscope itemtype="http://schema.org/HttpActionHandler" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                      <a href="${'link'}" class="btn-primary" itemprop="url" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; color: #fff; text-decoration: none; line-height: 2em; font-weight: bold; text-align: center; cursor: pointer; display: inline-block; border-radius: 5px; text-transform: capitalize; background-color: #348eda; margin: 0; border-color: #348eda; border-style: solid; border-width: 10px 20px;">Create Password</a>
                    </td>
                  </tr>
                  <tr>
                    <td class="content-block" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                      &mdash; <a style="text-align: center" href="https://jota.ng"><u>JOTA</u></a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <div class="footer" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; width: 100%; clear: both; color: #999; margin: 0; padding: 20px;">
            <table width="100%">
              <tr>
                <td class="aligncenter content-block" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 12px; vertical-align: top; color: #999; text-align: center; margin: 0; padding: 0 0 20px;" align="center" valign="top">
                  <!-- <a href="https://jota.ng">JOTA Team</a> -->
                </td>
              </tr>
            </table>
          </div>
        </div>
      </td>
      <td></td>
    </tr>
  </table>
</body>
</html>
`;

export const candidateWelcomeTemplate = template`
  <!DOCTYPE html>
  <html style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
    <head>
      <meta name="viewport" content="width=device-width" />
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <title>Welcome</title>
      <style type="text/css">
        body { -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none; width: 100% !important; height: 100%; line-height: 1.6em; background-color: #f6f6f6; margin: 0; }
        @media only screen and (max-width: 640px) {
          body { padding: 0 !important; }
          h1, h2, h3, h4 { font-weight: 800 !important; margin: 20px 0 5px !important; }
          h1 { font-size: 22px !important; }
          h2 { font-size: 18px !important; }
          h3 { font-size: 16px !important; }
          .container, .content-wrap { padding: 10px !important; width: 100% !important; }
          .invoice { width: 100% !important; }
        }
      </style>
    </head>
    <body itemscope itemtype="http://schema.org/EmailMessage" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none; width: 100% !important; height: 100%; line-height: 1.6em; background-color: #f6f6f6; margin: 0;" bgcolor="#f6f6f6">
      <table class="body-wrap" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; width: 100%; background-color: #f6f6f6; margin: 0;" bgcolor="#f6f6f6">
        <tr>
          <td></td>
          <td class="container" width="600" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; max-width: 600px !important; clear: both !important; margin: 0 auto;">
            <div class="content" style="padding: 20px;">
              <table class="main" width="100%" cellpadding="0" cellspacing="0" itemprop="action" itemscope itemtype="http://schema.org/ConfirmAction" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; border-radius: 3px; background-color: #fff; margin: 0; border: 1px solid #e9e9e9;" bgcolor="#fff">
                <tr>
                  <td class="content-wrap" style="padding: 20px;">
                    <meta itemprop="name" content="Confirm Email" />
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td class="content-block" style="padding: 0 0 20px;">
                          Congratulations <strong>${'firstName'}</strong>,<br />
                          An account has been created for you and you have been invited to take this exam:
                          <b>Exam Name: ${'title'}</b>
                          <b>Start Time: ${'startDate'}</b>
                          <b>End Time: ${'endDate'}</b>
                          Below are your credentials:
                          <b>username: ${'username'}</b>
                          <b>password: ${'password'}</b>
                        </td>
                      </tr>
                      <tr>
                        <td class="content-block" style="padding: 0 0 20px;">
                          Click the button below to login.
                        </td>
                      </tr>
                      <tr>
                        <td class="content-block" itemprop="handler" itemscope itemtype="http://schema.org/HttpActionHandler" style="padding: 0 0 20px;">
                          <a href="${'loginLink'}" class="btn-primary" itemprop="url" style="color: #fff; text-decoration: none; line-height: 2em; font-weight: bold; text-align: center; cursor: pointer; display: inline-block; border-radius: 5px; text-transform: capitalize; background-color: #348eda; margin: 0; border-color: #348eda; border-style: solid; border-width: 10px 20px;">
                            Login
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td class="content-block" style="padding: 0 0 20px;">
                          &mdash; <a style="text-align: center" href="https://jota.ng"><u>JOTA</u></a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <div class="footer" style="font-size: 14px; width: 100%; clear: both; color: #999; margin: 0; padding: 20px;">
                <table width="100%">
                  <tr>
                    <td class="aligncenter content-block" style="font-size: 12px; color: #999; text-align: center; margin: 0; padding: 0 0 20px;" align="center">
                      <!-- <a href="https://jota.ng">JOTA Team</a> -->
                    </td>
                  </tr>
                </table>
              </div>
            </div>
          </td>
          <td></td>
        </tr>
      </table>
    </body>
  </html>
`;
