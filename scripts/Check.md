multiple critical and high-severity vulnerabilities have been identified across core project 
dependencies including next, xlsx, glob, js-yaml, next-auth, and tmp. The most severe is a 
Remote Code Execution (RCE) vulnerability in Next.js/React. 
Detailed Vulnerability Findings & Recommendations
Below is a breakdown of each vulnerability, its impact, and the specific actions required for 
remediation. The general recommendation is to update the affected package to the specified 
secure version using your package manager (pnpm, npm, or yarn).
Critical & High Severity Vulnerabilities
Next.js is vulnerable to RCE in React flight protocol (Critical)
Detected in: next (npm)
Location: pnpm-lock.yaml
Description: A critical vulnerability exists in React Server Components (RSC) due to a 
f
law in how React deserializes payloads sent to server function endpoints, potentially 
allowing unauthenticated Remote Code Execution (RCE).
Recommendation: Upgrade the next package to a patched, stable version 
immediately. The vulnerability is fixed in React version 19.2.1 or later, which Next.js 
incorporates internally.
Prototype Pollution in sheetJS (High & Direct)
Detected in: xlsx (npm)
Location: pnpm-lock.yaml, apps/web/package.json
Description: The xlsx package is vulnerable to prototype pollution via a crafted file, 
which can allow an attacker to add or modify properties on an object's prototype.
Recommendation: The xlsx package on npm is no longer maintained. Migrate to the 
official, maintained SheetJS library (npm package sheetjs) and upgrade to version 
0.19.0 or later. Alternatively, use workarounds like Object.freeze(Object.prototype) or 
schema validation for all JSON inputs.
SheetJS Regular Expression Denial of Service (ReDoS) (High & Direct)
Detected in: xlsx (npm)
Location: pnpm-lock.yaml, apps/web/package.json
Description: The package is vulnerable to a Regular Expression Denial of Service 
(ReDoS) attack, where a specially crafted input can cause the application to consume 
excessive resources and become unresponsive.
Recommendation: As with the prototype pollution issue, the xlsx npm package is 
inactive. Migrate to the sheetjs package (version 0.20.2 or higher) or ensure the 
underlying vulnerable regex is patched if you are managing the library manually.
glob CLI: Command injection via -c/--cmd (High)
Detected in: glob (npm)
Location: pnpm-lock.yaml
Description: The glob Command Line Interface (CLI), when used with the -c or --cmd 
option, is vulnerable to command injection if it processes files with malicious names 
containing shell metacharacters. The library API itself is not affected.
Recommendation: Upgrade the glob package to version 10.5.0, 11.1.0, or 12.0.0 or 
higher. The fix redesigns how the CLI handles command execution to prevent shell: 
true usage with untrusted filenames.
glob CLI: Command injection via -c/--cmd (High)
Detected in: glob (npm)
Location: pnpm-lock.yaml
Description: The glob Command Line Interface (CLI), when used with the -c or --cmd 
option, is vulnerable to command injection if it processes files with malicious names 
containing shell metacharacters. The library API itself is not affected.
Recommendation: Upgrade the glob package to version 10.5.0, 11.1.0, or 12.0.0 or 
higher. The fix redesigns how the CLI handles command execution to prevent shell: 
true usage with untrusted filenames.
Moderate Severity Vulnerabilities
NextAuthjs Email misdelivery Vulnerability (Moderate)
Detected in: next-auth (npm)
Location: pnpm-lock.yaml
Description: A bug in the nodemailer dependency (used by next-auth) allows an 
attacker to force authentication emails to be delivered to an attacker-controlled 
mailbox via a crafted email address input (e.g., "e@attacker.com"@victim.com).
Recommendation: This issue is fixed in nodemailer version 7.0.7. Upgrade your next
auth package to the latest version (e.g., 4.24.12 or 5.0.0-beta.30) to ensure the 
patched nodemailer is used.
js-yaml has prototype pollution in merge (<<) (Moderate)
Detected in: js-yaml (npm)
Location: pnpm-lock.yaml
Description: In js-yaml versions 4.1.0 and below, an attacker can modify the prototype 
of the result of a parsed YAML document via prototype pollution using the __proto__ 
key.
Recommendation: Upgrade the js-yaml package to version 4.1.1 or 3.14.2 or higher. A 
potential server-side workaround is using the Node.js flag --disable-proto=delete.
tmp allows arbitrary temporary file / directory write via symbolic link dir parameter
Detected in: tmp (npm)
Description: The tmp package is vulnerable to arbitrary temporary file or directory 
writes via a symbolic link attack (CWE-59 Improper Link Resolution Before File 
Access). An attacker can create a malicious symlink to a sensitive location.
Recommendation: Upgrade the tmp package to a patched version (version 0.2.4 or 
0.2.5 or higher). You can also implement fs.realpathSync() in your usage to resolve 
symbolic links before acting on the path.