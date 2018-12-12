// ==UserScript==
// @name         ProgressPlus
// @namespace    https://github.com/brianush1/progressplus
// @version      1.0
// @updateURL    https://raw.githubusercontent.com/brianush1/progressplus/master/meta.js
// @downloadURL  https://raw.githubusercontent.com/brianush1/progressplus/master/script.js
// @description  Add new features to ProgressBook
// @author       brianush1
// @match        http*://parentaccess.ocps.net/*
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.7.3/Chart.bundle.min.js
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
                console.log(s);
                cat = {data: [], name: s[0].innerText, markElement: s[1]};
                let weight = -1;
                if (s[1] && s[1].innerText.startsWith("Weight: ")) {
                    cat.markElement = s[2];
                    weight = parseFloat(s[1].innerText.substring(8));
                }

                if (cat.markElement === undefined) {
                    cat.markElement = document.createElement("td");
                    cat.markElement.className = "HeaderText";
                    cat.markElement.align = "right";
                    cat.markElement.style.width = "30%";
                    let me = cat.markElement;
                    cat.markElement.appendChild(cat.markElement = document.createElement("span"));
                    v.getElementsByTagName("tr")[0].appendChild(me);
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
                    let r = rows[i];
                    let row = rows[i].children[3].innerText;
                    let weight = rows[i].children[2].innerText;

                    let ign = document.createElement("td");
                    ign.align = "center";
                    ign.width = "10%";
                    ign.innerText = row.includes("Mark") ? "Ignore?" : "";

                    r.insertBefore(ign, r.children[2]);

                    if (row.includes("Mark")) continue;

                    let checkbox = document.createElement("input");
                    checkbox.type = "checkbox";

                    ign.appendChild(checkbox);

                    checkbox.addEventListener("change", () => update());

                    if (row.startsWith("/")) continue

                    weight = parseInt(weight) || 0;
                    let grade = parseInt(row) || 0;
                    let outof = parseInt(row.split("/")[1]);
                    cat.data.push([weight, grade, outof, checkbox]);
                }

                let btn = document.createElement("button");
                btn.innerText = "Add new assignment";
                btn.style.width = "100%";
                btn.style.height = "2rem";
                console.log(c[i]);
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

            let ign = document.createElement("td");
            ign.align = "center";
            ign.width = "10%";

            c.appendChild(ign);

            let checkbox = document.createElement("input");
            checkbox.type = "checkbox";

            ign.appendChild(checkbox);

            a.push(checkbox);

            checkbox.addEventListener("change", () => update());

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
                    if (a[3].checked) continue;
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

    let username = (localStorage.loginAs || "global");

    let rgradeHistory = JSON.parse(localStorage.gradeHistory || "[]");

    function newRgradeHistory() {
        rgradeHistory = {version: 1, users: {[username]: [{}, {}, {}, {}]}};
    }

    if (rgradeHistory instanceof Array && rgradeHistory.length === 0) {
        newRgradeHistory();
    }

    let gradeHistory;

    function updateHistory() {
        if (rgradeHistory.version === undefined) {
            rgradeHistory = {
                version: 1,
                users: {
                    [username]: rgradeHistory
                }
            };
        }

        gradeHistory = rgradeHistory.users[username] || (rgradeHistory.users[username] = [{}, {}, {}, {}]);
        localStorage.gradeHistory = JSON.stringify(rgradeHistory);
    }

    updateHistory();

    function summary() {

        let quarter = document.getElementsByName("DropDownListGradingPeriod")[0];

        if (quarter) quarter = Number(quarter.querySelector("[selected=\"selected\"]").value) - 1; else quarter = 1;
        let quarterHistory = gradeHistory[quarter];

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
                let name = v.children[0].innerText.toUpperCase().trim();
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

                if (name in quarterHistory) {
                    let history = quarterHistory[name];
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
                    quarterHistory[name] = [];
                }

                quarterHistory[name].push({
                    quarter: quarter,
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
                quarterGradeText.insertBefore(changeSpan, quarterGradeText.lastElementChild);

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

    let tabs = document.getElementById("Banner1_TblItems");

    if (tabs) tabs = tabs.getElementsByTagName("tr")[0];

    let thisTab;

    if (window.location.href.includes("ProgressDetails.aspx")) thisTab = "details";
    if (window.location.href.includes("ProgressSummary.aspx")) thisTab = "summary";

    let ttb = window.location.search.match(/^\?Tab=(.*)$/);

    if (ttb) thisTab = ttb[1];

    function del(e) {
        e.parentElement.removeChild(e);
    }

    function createTab(name, id, sel, opt, fn) {
        if (!(window.location.href.includes("Classroom/Schedule.aspx")
           || window.location.href.includes("/Progress/"))) {
            return;
        }

        let tabC = document.createElement("td");
        let link = document.createElement("a");

        link.className = (thisTab === id ? "Selected" : "") + "TabItemText";
        link.innerText = name;
        link.href = "https://parentaccess.ocps.net/Progress/ProgressSummary.aspx?Tab=" + id;

        tabC.appendChild(link);

        let separator = document.createElement("td");

        separator.align = "center";
        separator.style.width = "20px";

        let span = document.createElement("span");

        span.innerText = "|";
        span.style.color = "white";

        separator.appendChild(span);

        tabs.insertBefore(tabC, tabs.children[0]);
        tabs.insertBefore(separator, tabs.children[0]);

        if (id === thisTab) {
            document.title = "ProgressPlus - " + name;
            let past = false;

            const x = document.getElementsByName("Form1")[0];

            document.querySelectorAll("a[title=\"Get Averages\"]")[0].className = "TabItemText";

            const qrt = (document.querySelectorAll("#DropDownListGradingPeriod>option[selected=\"selected\"]")[0]).innerText;

            let select, q;

            for (let i = 0; i < x.children.length; ++i) {
                let c = x.children[i];
                if (c.id === "TablePageGrid") del(c);
                if (c.className === "Tab") {
                    const tr = c.children[0].children[0];
                    del(tr.children[0]);

                    const td = document.createElement("td");
                    td.align = "center";

                    tr.appendChild(td);

                    if (sel !== undefined) {
                        const span = document.createElement("span");
                        span.className = "TabText";
                        span.innerText = sel + ": \xa0";

                        td.appendChild(span);
                    }

                    select = document.createElement("select");
                    select.id = "DropDownListOptPeriod";

                    q = document.createElement("select");
                    q.id = "DropDownListGradingPeriod";

                    if (opt !== undefined) {
                        for (let j = 0; j < opt.length; ++j) {
                            const o = opt[j];
                            const oe = document.createElement("option");
                            oe.innerText = o;
                            select.appendChild(oe);
                        }

                        td.appendChild(select);
                    }

                    if (sel !== undefined) {
                        for (let j = 0; j < 4; ++j) {
                            const o = "Q" + (j + 1);
                            const oe = document.createElement("option");
                            if (o === qrt) {
                                oe.selected = true;
                            }
                            oe.innerText = o;
                            q.appendChild(oe);
                        }

                        td.appendChild(q);
                    }
                }
            }

            const ch = fn();

            select.addEventListener("change", () => ch(select.selectedIndex, q.selectedIndex));
            q.addEventListener("change", () => ch(select.selectedIndex, q.selectedIndex));

            ch(0, parseInt(qrt.substring(1))-1);
        }
    }

    createTab("Graph", "graph-view", "View", ["All", "Past week", "Past hour"], function() {
        let ctx = document.createElement("canvas");
        ctx.width = "400";
        ctx.height = "200";
        ctx.width = "50%";

        document.body.appendChild(ctx);

        const clr = [255, 128, 0];
        const time = {};
        let chd = {
            type: "line",
            data: {datasets: []},
            options: {
				responsive: true,
				title: {
					display: true,
					text: "ProgressPlus Graph View"
				},
				tooltips: {
					mode: 'index',
					intersect: false,
				},
				hover: {
					mode: 'nearest',
					intersect: true
				},
                animation: {
                    duration: 0, // general animation time
                },
                hover: {
                    animationDuration: 0, // duration of animations when hovering an item
                },
                responsiveAnimationDuration: 0, // animation duration after a resize
				scales: {
					xAxes: [{
                        type: "time",
						display: true,
						scaleLabel: {
							display: true,
							labelString: 'Time'
						},
                        time
					}],
					yAxes: [{
                        type: "linear",
						display: true,
						scaleLabel: {
							display: true,
							labelString: 'Grade'
						}
					}]
				}
            }
        };

        let chart = new Chart(ctx, chd);

        return (u, q) => {
            //if (true) return;
            const history = gradeHistory[q];

            let d;

            if (u === 1) {
                d = 3600 * 24 * 7 * 1000;
            } else if (u === 2) {
                d = 3600 * 1000;
            }

            console.log(u);

            time.min = d === undefined ? undefined : new Date(new Date() - new Date(d));
            time.max = d === undefined ? undefined : new Date();

            /*const days =
                  u === 0 ? 7 :
            0;*/

            const data = chd.data;

            data.datasets = [];

            const colors = [
                [255, 0, 0],
                [255, 128, 0],
                [0, 192, 0],
                [255, 0, 128],
                [0, 255, 255],
                [0, 148, 255],
                [192, 192, 0],
                [64, 192, 192],
                [255, 64, 192],
            ];

            let colori = 0;

            for (const i in history) {
                const v = history[i];

                const clr = colors[colori++];
                if (colori === colors.length) colori = 0;
                const d = [];

                console.log(v);

                let L = 0;
                for (const _ in v) {
                    const x = v[_];

                    d.push({x: new Date(x.date), y: x.grade});
                }

                data.datasets.push({label: i, borderColor: `rgb(${clr[0]},${clr[1]},${clr[2]})`, backgroundColor: `rgba(${clr[0]},${clr[1]},${clr[2]},0.2)`, fill: false, data: d, showLine: true});
            }

            console.log(data);

            //console.log(history);
            //console.log(days);

            chart.update();
        }
    });

    createTab("Data", "data-view", undefined, undefined, function() {

        const t = document.createElement("table");
        t.id = "TableMain";
        t.cellspacing = "1";
        t.cellpadding = "1";
        t.width = "100%";
        t.border = "0";

        t.innerHTML = `<td align="center">
<table class="ContentSection" id="TableDialog" cellspacing="1" cellpadding="2" width="45%" border="0" style="BORDER-RIGHT: black 1px solid; BORDER-TOP: black 1px solid; BORDER-LEFT: black 1px solid; BORDER-BOTTOM: black 1px solid">
<tbody><tr>
<td colspan="2">&nbsp;</td>
</tr>
<tr>
<td align="center" colspan="2"><b>Warning:</b> Pressing "Clear Data" will delete ALL of your saved grade history
</td>
</tr>
<tr>
<td align="center" colspan="2"><br/>
<input type="submit" value="Import" onclick="javascript:ProgressPlus_Import();">
<input type="submit" value="Export" onclick="javascript:ProgressPlus_Export();">
<input type="submit" value="Clear Data" onclick="javascript:ProgressPlus_ClearData();">
</td>
</tr>
<tr>
<td colspan="2">&nbsp;</td>
</tr>
</tbody></table>
</td>`;
        document.body.appendChild(t);

        return (u, q) => {
            const input = document.createElement("input");
            input.setAttribute("type", "file");

            input.addEventListener("change", function() {
                const file = input.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function() {
                        try {
                            rgradeHistory = JSON.parse(reader.result);
                            localStorage.gradeHistory = JSON.stringify(rgradeHistory);
                        } catch (e) {
                            console.log(e);
                            alert("Invalid data file");
                        }
                    }
                    reader.readAsText(file);
                }
            });

            window.ProgressPlus_Import = function() {
                input.click();
            }

            window.ProgressPlus_Export = function() {
                const data = JSON.stringify(rgradeHistory);
                const dataBlob = new Blob([data], {type: "application/json"});
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement("a");
                link.href = url;
                const today = new Date();
                link.download = "gradeData-" + today.getFullYear() + today.getMonth() + today.getDay() + ".json";
                link.click();
            }

            window.ProgressPlus_ClearData = function() {
                newRgradeHistory();
                localStorage.gradeHistory = JSON.stringify(rgradeHistory);
            }
        };
    });

    if (thisTab === "details") details();
    else if (thisTab === "summary") summary();

    if (window.location.href.includes("LoginPage.aspx")) {
        document.getElementById("ButtonLogin").addEventListener("click", (e) => {
            const val = document.getElementById("TextBoxUserName").value;
            localStorage.setItem("loginAs", val);
        });
    }
})();
