// ==UserScript==
// @name         ProgressPlus
// @namespace    https://github.com/brianush1/progressplus
// @version      0.3
// @updateURL    https://raw.githubusercontent.com/brianush1/progressplus/master/meta.js
// @downloadURL  https://raw.githubusercontent.com/brianush1/progressplus/master/script.js
// @description  Add new features to ProgressBook
// @author       a cool frood
// @match        http*://parentaccess.ocps.net/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function formatGrade(avg) {
        let letter = "F";
        if (avg >= 59.5) letter = "D";
        if (avg >= 69.5) letter = "C";
        if (avg >= 79.5) letter = "B";
        if (avg >= 89.5) letter = "A";
        return `${avg.toFixed(2)} ${letter}`;
    }

    function details() {
        let viewByDate = document.getElementById("LinkButtonView");
        viewByDate.parentNode.removeChild(viewByDate);

        let ta = document.getElementById("TableAssessment");
        let c_ = ta.children;
        let c = [];
        for (let i = 0; i < c_.length; ++i) c[i] = c_[i];
        let data = [];
        let cat = null;
        let gMarkElement = document.getElementById("LabelAverage");
        let newAssignment;
        let btns = [];
        for (let i = 0; i < c.length; ++i) {
            let v = c[i];
            if (v.className == "DataGrid") {
                self.__doPostBack('LinkButtonView','');
            } else {
                let s = v.getElementsByTagName("span");
                cat = {data: [], name: s[0].innerText, markElement: s[1]};
                let weight = -1;
                if (s[1].innerText.startsWith("Weight: ")) {
                    cat.markElement = s[2];
                    weight = parseFloat(s[1].innerText.substring(8));
                }
                cat.mark = parseFloat(cat.markElement.innerText.substring(6));
                cat.weight = weight;
                data.push(cat);
                data[cat.name] = cat;

                let index = i / 2;
                let e = c[++i].getElementsByTagName("tbody")[0];
                cat.dataGrid = e;

                let rows = e.getElementsByTagName("tr");
                for (let i = 0; i < rows.length; ++i) {
                    let row = rows[i].children[3].innerText;
                    let weight = rows[i].children[2].innerText;
                    if (row.includes("Mark")) continue;
                    if (row.startsWith("/")) continue;
                    weight = parseInt(weight) || 0;
                    let grade = parseInt(row) || 0;
                    let outof = parseInt(row.split("/")[1]);
                    cat.data.push([weight, grade, outof]);
                }

                let btn = document.createElement("button");
                btn.innerText = "Add new assignment";
                btn.style.width = "100%";
                btn.style.height = "2rem";
                ta.insertBefore(btn, c[i].nextSibling);

                btns.push(btn);
            }
        }

        let newColumn = (c, edit, val, left) => {
            let res = document.createElement("td");
            res.setAttribute("align", left ? "left" : "center");
            if (edit) {
                let grade = document.createElement("input");
                res.grade = grade;
                if (val === 1) grade.style.width = "2rem";
                else {
                    grade.style.width = "calc(100% - 20px)";
                    grade.value = val;
                }
                grade.type = "text";

                let max;
                if (val === 1) {
                    max = document.createElement("input");
                    res.max = max;
                    max.style.width = "2rem";
                    max.type = "text";
                }

                res.appendChild(grade);
                if (val === 1) {
                    res.appendChild(document.createTextNode(" / "));
                    res.appendChild(max);
                    let __K = res.appendChild(document.createElement("span"));
                    c.appendChild(res);
                    return [res, grade, max, __K];
                }
            } else {
                res.innerText = val;
            }
            c.appendChild(res);
            return res;
        }

        let update;

        newAssignment = (i) => {
            let cat = data[i];
            let c = document.createElement("tr");
            c.className = cat.dataGrid.children.length % 2 == 1 ? "GridItem" : "GridAltItem";
            let a = [1, 0, 0];

            let date = newColumn(c, false, "N/A");
            let name = newColumn(c, true, "New Assignment", true);
            let weight = newColumn(c, true, "1");
            let [mark, grade, max, q] = newColumn(c, true, 1);
            let late = newColumn(c, false, "N/A");
            let comments = newColumn(c, false, "");
            let removeBtn = document.createElement("button");
            removeBtn.style.width = "100%";
            removeBtn.style.height = "100%";
            removeBtn.innerText = "Remove"

            comments.appendChild(removeBtn);
            cat.dataGrid.appendChild(c);

            removeBtn.addEventListener("click",
                                       (e) => {
                c.parentNode.removeChild(c);
                a[0] = 0;
                a[1] = 0;
                a[2] = 0;
                update();
                e.preventDefault();
                return false;
            });

            cat.data.push(a);

            let u = () => {
                let g = a[1] / a[2];
                if (!isFinite(g) || isNaN(g)) {
                    q.innerText = "";
                } else q.innerText = ` (${Math.round(g * 100)}%)`;
            };

            weight.grade.addEventListener("input", (e) => {
                a[0] = parseFloat(weight.grade.value) || 0;
                u();
                update();
                e.preventDefault();
                return false;
            });

            grade.addEventListener("input", (e) => {
                a[1] = parseFloat(grade.value) || 0;
                u();
                update();
                e.preventDefault();
                return false;
            });

            max.addEventListener("input", (e) => {
                a[2] = parseFloat(max.value) || 0;
                u();
                update();
                e.preventDefault();
                return false;
            });
        }

        update = () => {
            let avg = 0;
            let count = 0;

            for (let i = 0; i < data.length; ++i) {
                let cat = data[i];

                let catavg = 0;
                let catc = 0;
                for (let j = 0; j < cat.data.length; ++j) {
                    let a = cat.data[j];
                    catavg += a[0] * a[1];
                    catc += a[0] * a[2];
                    if (cat.weight == -1) {
                        avg += a[0] * a[1] * 100;
                        count += a[0] * a[2];
                    }
                }

                cat.mark = catavg * 100 / catc;
                if (cat.weight > 0 && !isNaN(cat.mark)) {
                    avg += cat.mark * cat.weight;
                    count += cat.weight;
                }
                cat.markElement.innerText = `Mark: ${formatGrade(cat.mark)}`;
            }

            gMarkElement.innerText = `Mark: ${formatGrade(avg / count)}`;
        };

        for (let i = 0; i < btns.length; ++i) {
            let btn = btns[i];
            btn.addEventListener("click", (e) => {
                newAssignment(i);
                e.preventDefault();
                return false;
            });
        }
    }

    function summary() {
        let gradeHistory = JSON.parse(localStorage.gradeHistory || "{}");
        let datagrid = document.getElementsByClassName("DataGrid")[0];
        let tbody = datagrid.parentNode.parentNode.parentNode;
        let grid = datagrid.getElementsByTagName("tbody")[0];
        let ggpa = 0;
        let gugpa = 0;
        let count = 0;
        for (let i = 0; i < grid.children.length; ++i) {
            let v = grid.children[i];
            let e = document.createElement("td");
            e.align = "center";
            if (i == 0) {
                e.innerText = "GPA";
            } else {
                let name = v.children[0].innerText.toUpperCase();
                let quarterGradeText = v.children[1];
                let quarterGrade = Number((quarterGradeText.innerText.match(/(\d+\.\d+)/) || [0, NaN])[1]);
                let gradeText = v.children[2];
                let grade = Number((gradeText.innerText.match(/(\d+\.\d+)/) || [0, NaN])[1]);
                let change = 0;
                let changeYTD = 0;
                let add = 0;
                if (name.match(/\bADV\s+PL\b/) || name.match(/\bAP\b/)) {
                    add = 2;
                } else if (name.match(/\bHON\b/) || name.match(/\bADV\b/)) {
                    add = 1;
                }
                let gpa = null;
                let ugpa = null;
                if (grade >= 89.5) { gpa = 4 + add; ugpa = 4; }
                else if (grade >= 79.5) { gpa = 3 + add; ugpa = 3; }
                else if (grade >= 69.5) { gpa = 2 + add; ugpa = 2; }
                else if (grade >= 59.5) { gpa = 1; ugpa = 1; }
                else { gpa = 0; ugpa = 0; }

                if (name in gradeHistory) {
                    let history = gradeHistory[name];
                    let last = -Infinity;
                    let lastIndex = -1;
                    for (let i = 0; i < history.length; ++i) {
                        let curr = history[i];
                        if (last !== curr.grade) {
                            last = curr.grade;
                            lastIndex = i;
                        }
                    }

                    if (lastIndex >= 1) {
                        change = last - history[lastIndex - 1].grade;
                        changeYTD = history[lastIndex].yearToDate - history[lastIndex - 1].yearToDate;
                    }
                } else {
                    gradeHistory[name] = [];
                }

                gradeHistory[name].push({
                    grade: quarterGrade,
                    yearToDate: grade,
                    gpa: gpa,
                    ugpa: ugpa,
                    date: Date.now(),
                    dateString: new Date().toString()
                });

                localStorage.gradeHistory = JSON.stringify(gradeHistory);

                let changeSpan = document.createElement("span");
                changeSpan.innerText = ` (${change >= 0 ? "+" : ""}${change.toFixed(2)})`;
                if (change > 0) changeSpan.style.color = "green";
                else if (change < 0) changeSpan.style.color = "red";
                else changeSpan.style.color = "gray";
                //quarterGradeText.insertBefore(changeSpan, quarterGradeText.lastElementChild);

                let changeYTDSpan = document.createElement("span");
                changeYTDSpan.innerText = ` (${changeYTD >= 0 ? "+" : ""}${changeYTD.toFixed(2)})`;
                if (changeYTD > 0) changeYTDSpan.style.color = "green";
                else if (changeYTD < 0) changeYTDSpan.style.color = "red";
                else changeYTDSpan.style.color = "gray";
                gradeText.insertBefore(changeYTDSpan, gradeText.lastElementChild);

                ggpa += gpa;
                gugpa += ugpa;
                if (!isNaN(grade)) count++;
                e.innerText = `${gpa.toFixed(1)} (${ugpa.toFixed(1)})`;
            }
            v.insertBefore(e, v.children[3]);
        }

        let gpaTr = document.createElement("tr");
        let gpaTd = document.createElement("td");
        gpaTd.align = "center";
        gpaTd.valign = "top";
        gpaTd.className = "Message";
        gpaTd.innerText = `GPA: ${(ggpa / count).toFixed(2)} (${(gugpa / count).toFixed(2)})`;
        gpaTr.appendChild(gpaTd);
        tbody.insertBefore(gpaTr, datagrid.parentNode.parentNode);

        let gpaTr2 = document.createElement("tr");
        let gpaTd2 = document.createElement("td");
        gpaTd2.align = "center";
        gpaTd2.valign = "top";
        gpaTd2.className = "AverageMessage";
        gpaTd2.innerHTML = `<b class="Message">(GPA)</b>: Year to date unweighted.<br><b class="Message">GPA</b>: Year to date weighted.`;
        gpaTr2.appendChild(gpaTd2);
        tbody.appendChild(gpaTr2);
    }

    if (window.location.href.includes("ProgressDetails.aspx")) details();
    else if (window.location.href.includes("ProgressSummary.aspx")) summary();
})();
